const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Storage } = require('@google-cloud/storage');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ImageAnnotatorClient } = require('@google-cloud/vision'); // For PDF OCR
const { SpeechClient } = require('@google-cloud/speech'); // For audio
const { VideoIntelligenceServiceClient } = require('@google-cloud/video-intelligence'); // For video
const { Firestore } = require('@google-cloud/firestore'); // For Firestore
const { BigQuery } = require('@google-cloud/bigquery'); // For BigQuery

const secretManagerClient = new SecretManagerServiceClient();
const storage = new Storage();
const visionClient = new ImageAnnotatorClient();
const speechClient = new SpeechClient();
const videoIntelligenceClient = new VideoIntelligenceServiceClient();
const firestore = new Firestore();
const bigquery = new BigQuery();

// Helper function to retrieve secret from Secret Manager
async function getSecret(secretName) {
    const [version] = await secretManagerClient.accessSecretVersion({
        name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
}

/**
 * Processes uploaded documents (PDFs, audio, video) from a Cloud Storage bucket.
 * Triggered by a Cloud Storage object finalization event.
 *
 * @param {object} cloudEvent The Cloud Storage event.
 */
exports.processDocument = async (cloudEvent) => {
    const file = cloudEvent.data;
    const bucketName = file.bucket;
    const fileName = file.name;
    const contentType = file.contentType;

    console.log(`Processing file: ${fileName} from bucket: ${bucketName} with content type: ${contentType}`);

    try {
        // Retrieve Gemini API Key from Secret Manager
        const geminiApiKey = await getSecret(process.env.GEMINI_API_SECRET_NAME);
        console.log('Gemini API Key (first 5 chars):', geminiApiKey.substring(0, 5));

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Download the file
        const fileBuffer = await storage.bucket(bucketName).file(fileName).download();
        const fileContent = fileBuffer[0];

        let extractedText = '';

        // Basic content type handling (expand as needed)
        if (contentType === 'application/pdf') {
            console.log('Processing PDF with Vision API for OCR...');
            const gcsUri = `gs://${bucketName}/${fileName}`;
            const [result] = await visionClient.asyncBatchAnnotateFiles({
                requests: [{
                    inputConfig: {
                        gcsSource: { uri: gcsUri },
                        mimeType: 'application/pdf',
                    },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                }],
            });
            // Assuming a single response for simplicity, adjust for multiple files/pages
            if (result.responses && result.responses.length > 0 && result.responses[0].fullTextAnnotation) {
                extractedText = result.responses[0].fullTextAnnotation.text;
            } else {
                console.log('No text found in PDF or unexpected Vision API response.');
            }
            console.log('PDF OCR complete.');
        } else if (contentType.startsWith('audio/')) {
            console.log('Processing audio with Speech-to-Text API...');
            const gcsUri = `gs://${bucketName}/${fileName}`;
            const [operation] = await speechClient.longRunningRecognize({
                config: {
                    encoding: 'LINEAR16', // Adjust based on actual audio encoding
                    sampleRateHertz: 16000, // Adjust based on actual sample rate
                    languageCode: 'en-US',
                },
                audio: {
                    uri: gcsUri,
                },
            });
            const [response] = await operation.promise();
            extractedText = response.results.map(result => result.alternatives[0].transcript).join('\n');
            console.log('Audio transcription complete.');
        } else if (contentType.startsWith('video/')) {
            console.log('Processing video with Video Intelligence API for transcription...');
            const gcsUri = `gs://${bucketName}/${fileName}`;
            const [operation] = await videoIntelligenceClient.annotateVideo({
                inputUri: gcsUri,
                features: ['SPEECH_TRANSCRIPTION'],
                videoContext: {
                    speechTranscriptionConfig: {
                        languageCode: 'en-US',
                        enableAutomaticPunctuation: true,
                    },
                },
            });
            const [response] = await operation.promise();
            extractedText = response.annotationResults[0].speechTranscriptions.map(transcription =>
                transcription.alternatives[0].transcript
            ).join('\n');
            console.log('Video transcription complete.');
        } else if (contentType.startsWith('text/')) {
            console.log('Handling text file...');
            extractedText = fileContent.toString('utf8');
        } else {
            console.log('Unsupported content type, skipping:', contentType);
            return;
        }

        if (extractedText) {
            console.log('Feeding extracted text to Gemini for analysis...');
            const prompt = `Analyze the following text from a startup document and extract key insights, potential risks, and a brief summary:

${extractedText.substring(0, 2000)}...`; // Limit text for prompt
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            console.log('Gemini Analysis Result:', text);

            // Store results in Firestore
            const startupId = fileName.split('.')[0]; // Simple ID for now
            const docRef = firestore.collection('startupAnalyses').doc(startupId);
            await docRef.set({
                fileName: fileName,
                bucketName: bucketName,
                contentType: contentType,
                extractedText: extractedText.substring(0, 10000), // Store a portion
                geminiAnalysis: text, // Raw Gemini output
                timestamp: Firestore.FieldValue.serverTimestamp(),
            });
            console.log('Analysis results stored in Firestore.');

            // Store structured data in BigQuery (assuming Gemini output can be parsed)
            const datasetId = process.env.BIGQUERY_DATASET_ID || 'startup_kpis';
            const tableId = process.env.BIGQUERY_PUBLIC_DATA_TABLE_ID || 'public_data';
            const table = bigquery.dataset(datasetId).table(tableId);

            // Placeholder for parsing Gemini output into BigQuery schema
            const parsedGeminiOutput = { /* Parse 'text' into your BigQuery schema */ };

            const rows = [{
                startup_name: startupId,
                // ... populate other fields from parsedGeminiOutput ...
                urls: [`gs://${bucketName}/${fileName}`],
                // Example: founder_market_fit_score: parsedGeminiOutput.founder_market_fit_score,
            }];
            await table.insert(rows);
            console.log('Structured data stored in BigQuery.');
        }

    } catch (error) {
        console.error('Error in processDocument:', error);
        throw new Error('Failed to process document.');
    }
};
