const { Storage } = require('@google-cloud/storage');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { SpeechClient } = require('@google-cloud/speech');
const { Firestore } = require('@google-cloud/firestore');
const { VideoIntelligenceServiceClient } = require('@google-cloud/video-intelligence');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { htmlToText } = require('html-to-text');
const emlFormat = require('eml-format');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');

const storage = new Storage();
const visionClient = new ImageAnnotatorClient();
const speechClient = new SpeechClient();
const firestore = new Firestore();
const videoIntelligenceClient = new VideoIntelligenceServiceClient();

// Helper function to chunk large strings
function chunkString(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substring(o, o + size);
    }
    return chunks;
}

// Helper function to recursively extract text from PPTX slide XML
function extractTextFromXml(node) {
    let text = '';
    // If node is null or not an object/array, there's nothing to process.
    if (!node || typeof node !== 'object') {
        return '';
    }

    // If the node is an array, iterate over its elements and recurse.
    if (Array.isArray(node)) {
        node.forEach(child => {
            text += extractTextFromXml(child);
        });
        return text;
    }

    // If we are at an object, check for the 'a:t' text tag, which is the text content.
    // xml2js parses the text into an array, e.g., { 'a:t': ['Hello'] }
    if (node['a:t'] && Array.isArray(node['a:t'])) {
        text += node['a:t'].join(' ') + ' ';
    }

    // Recurse through all other child properties of the object.
    for (const key in node) {
        // Avoid reprocessing the text node we just handled.
        if (key !== 'a:t') {
            text += extractTextFromXml(node[key]);
        }
    }

    return text;
}

exports.processDocument = async (req, res) => {
    try {
        const { bucketName, fileName, contentType } = req.body;
        if (!bucketName || !fileName || !contentType) {
            return res.status(400).send('Missing bucketName, fileName, or contentType in request body.');
        }

        console.log(`Processing file: ${fileName} from bucket: ${bucketName} with content type: ${contentType}`);

        const fileBuffer = await storage.bucket(bucketName).file(fileName).download();
        const fileContent = fileBuffer[0];

        let extractedText = '';
        const gcsUri = `gs://${bucketName}/${fileName}`;

        if (contentType === 'application/pdf') {
            console.log('Processing PDF with Vision API for OCR...');
            const [result] = await visionClient.asyncBatchAnnotateFiles({
                requests: [{
                    inputConfig: { gcsSource: { uri: gcsUri }, mimeType: 'application/pdf' },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                }],
            });
            if (result.responses && result.responses.length > 0 && result.responses[0].fullTextAnnotation) {
                extractedText = result.responses[0].fullTextAnnotation.text;
            }
            console.log('PDF OCR complete.');
        } else if (contentType.startsWith('image/')) {
            console.log('Processing image with Vision API for OCR...');
            const [result] = await visionClient.textDetection(fileContent);
            if (result.fullTextAnnotation) {
                extractedText = result.fullTextAnnotation.text;
            }
            console.log('Image OCR complete.');
        } else if (contentType.startsWith('audio/')) {
            console.log('Processing audio with Speech-to-Text API...');
            const config = { languageCode: 'en-US', enableAutomaticPunctuation: true };
            if (contentType === 'audio/l16') {
                config.encoding = 'LINEAR16';
                config.sampleRateHertz = 16000;
            }
            const [operation] = await speechClient.longRunningRecognize({ config, audio: { uri: gcsUri } });
            const [response] = await operation.promise();
            extractedText = response.results.map(result => result.alternatives[0].transcript).join('\n');
            console.log('Audio transcription complete.');
        } else if (contentType.startsWith('video/')) {
            console.log('Processing video with Video Intelligence API for transcription...');
            const [operation] = await videoIntelligenceClient.annotateVideo({
                inputUri: gcsUri,
                features: ['SPEECH_TRANSCRIPTION'],
                videoContext: { speechTranscriptionConfig: { languageCode: 'en-US', enableAutomaticPunctuation: true } },
            });
            const [response] = await operation.promise();
            if (response.annotationResults[0] && response.annotationResults[0].speechTranscriptions) {
                extractedText = response.annotationResults[0].speechTranscriptions.map(t => t.alternatives[0].transcript).join('\n');
            }
            console.log('Video transcription complete.');
        } else if (contentType === 'message/rfc822') {
            console.log('Processing EML file...');
            const emlData = await new Promise((resolve, reject) => {
                emlFormat.parse(fileContent, (error, data) => {
                    if (error) return reject(error);
                    resolve(data);
                });
            });
            if (emlData.html) {
                extractedText = htmlToText(emlData.html, { wordwrap: false });
            } else {
                extractedText = emlData.text || '';
            }
            console.log('EML processing complete.');
        } else if (contentType === 'text/html') {
            console.log('Handling HTML file...');
            extractedText = htmlToText(fileContent.toString('utf8'), { wordwrap: false });
            console.log('HTML processing complete.');
        } else if (contentType.startsWith('text/')) {
            console.log('Handling text file...');
            extractedText = fileContent.toString('utf8');
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log('Processing DOCX with Mammoth...');
            const result = await mammoth.extractRawText({ buffer: fileContent });
            extractedText = result.value;
            console.log('DOCX processing complete.');
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            console.log('Processing PPTX with adm-zip and xml2js...');
            const zip = new AdmZip(fileContent);
            const zipEntries = zip.getEntries();
            const slidePromises = zipEntries
                .filter(entry => entry.entryName.startsWith('ppt/slides/slide'))
                .map(async (entry) => {
                    const slideXml = entry.getData().toString('utf8');
                    const parser = new xml2js.Parser();
                    const slideData = await parser.parseStringPromise(slideXml);
                    return extractTextFromXml(slideData);
                });
            const slideTexts = await Promise.all(slidePromises);
            extractedText = slideTexts.join('\n\n');
            console.log('PPTX processing complete.');
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            console.log('Processing XLSX with xlsx...');
            const workbook = xlsx.read(fileContent, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            extractedText = xlsx.utils.sheet_to_csv(worksheet);
			console.log('XLSX processing complete.');
        } else {
            console.log('Unsupported content type, skipping:', contentType);
        }

        if (extractedText && extractedText.trim()) {
            const projectId = path.dirname(fileName);
            const actualFileName = path.basename(fileName);
            const fileId = actualFileName.substring(0, actualFileName.lastIndexOf('.')) || actualFileName;

            const projectDocRef = firestore.collection('projects').doc(projectId);
            const fileDocRef = projectDocRef.collection('files').doc(fileId);

            const chunkSize = 500 * 1024;
            const textChunks = chunkString(extractedText, chunkSize);
            const chunkIds = [];
            const batch = firestore.batch();

            textChunks.forEach((chunk, index) => {
                const chunkDocRef = fileDocRef.collection('textChunks').doc();
                chunkIds.push(chunkDocRef.id);
                batch.set(chunkDocRef, { order: index, content: chunk, timestamp: Firestore.FieldValue.serverTimestamp() });
            });

            // Set project metadata (optional, but good practice)
            batch.set(projectDocRef, { updatedAt: Firestore.FieldValue.serverTimestamp() }, { merge: true });

            // Set file data
            batch.set(fileDocRef, {
                fileName: actualFileName,
                bucketName,
                contentType,
                geminiAnalysis: '',
                timestamp: Firestore.FieldValue.serverTimestamp(),
                textChunkIds: chunkIds,
                numberOfTextChunks: chunkIds.length,
            }, { merge: true });

            await batch.commit();

            console.log(`Extracted text stored in ${textChunks.length} chunks for fileId: ${fileId} in project: ${projectId}.`);
            res.status(200).json({
                message: 'Document processed and stored successfully.',
                projectId: projectId,
                fileId: fileId,
                chunks: chunkIds.length
            });
        } else {
            console.log('No text could be extracted from the document.');
            res.status(400).send('No text could be extracted from the document.');
        }
    } catch (error) {
        console.error('Error in processDocument:', error);
        res.status(500).send('An error occurred while processing the document.');
    }
};