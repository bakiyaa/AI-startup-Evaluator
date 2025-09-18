const { Storage } = require('@google-cloud/storage');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { SpeechClient } = require('@google-cloud/speech');
const { VideoIntelligenceServiceClient } = require('@google-cloud/video-intelligence');
const mammoth = require('mammoth');

const storage = new Storage();
const visionClient = new ImageAnnotatorClient();
const speechClient = new SpeechClient();
const videoIntelligenceClient = new VideoIntelligenceServiceClient();

/**
 * HTTP Cloud Function to extract text from a document in Cloud Storage.
 * This function is designed to be called by a Cloud Workflow.
 *
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 */
exports.processDocument = async (req, res) => {
    const { bucketName, fileName, contentType } = req.body;

    if (!bucketName || !fileName || !contentType) {
        res.status(400).send('Missing bucketName, fileName, or contentType in request body.');
        return;
    }

    console.log(`Extracting text from file: ${fileName} from bucket: ${bucketName}`);

    try {
        const fileBuffer = await storage.bucket(bucketName).file(fileName).download();
        const fileContent = fileBuffer[0];
        let extractedText = '';

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
            if (result.responses && result.responses.length > 0 && result.responses[0].fullTextAnnotation) {
                extractedText = result.responses[0].fullTextAnnotation.text;
            }
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
        } else if (contentType.startsWith('text/')) {
            console.log('Handling text file...');
            extractedText = fileContent.toString('utf8');
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log('Processing DOCX with Mammoth...');
            const result = await mammoth.extractRawText({ buffer: fileContent });
            extractedText = result.value;
        } else {
            console.log('Unsupported content type:', contentType);
            res.status(400).send(`Unsupported content type: ${contentType}`);
            return;
        }

        console.log('Text extraction complete.');
        res.status(200).send(extractedText);

    } catch (error) {
        console.error('Error in processDocument:', error);
        res.status(500).send(`Failed to process document: ${error.message}`);
    }
};