const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { SpeechClient } = require('@google-cloud/speech');
const { Firestore } = require('@google-cloud/firestore');

// Initialize clients
const storage = new Storage();
const visionClient = new ImageAnnotatorClient();
const speechClient = new SpeechClient();
const firestore = new Firestore();
let genAI;

try {
  const { Gemini } = require('@google/generative-ai');
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable not set.');
  }
  genAI = new Gemini({ apiKey: process.env.GEMINI_API_KEY });
} catch (error) {
  console.error('Failed to initialize Gemini client:', error);
}

functions.cloudEvent('process-document', async (cloudEvent) => {
  if (!genAI) {
    console.error('Gemini client not initialized. Cannot process document.');
    return;
  }

  const bucket = cloudEvent.data.bucket;
  const file = cloudEvent.data.name;

  console.log(`Processing file: ${file}`);

  // 1. Download the file from Cloud Storage
  const fileBuffer = await storage.bucket(bucket).file(file).download();

  let extractedText = '';

  // 2. Extract text based on file type
  if (file.endsWith('.pdf')) {
    // Use Vision AI for PDF
    const [result] = await visionClient.documentTextDetection(fileBuffer);
    extractedText = result.fullTextAnnotation.text;
  } else if (file.endsWith('.wav') || file.endsWith('.mp3')) {
    // Use Speech-to-Text for audio
    const [response] = await speechClient.recognize({
      audio: { content: fileBuffer.toString('base64') },
      config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US' },
    });
    extractedText = response.results.map(result => result.alternatives[0].transcript).join('\n');
  } else {
    // For plain text
    extractedText = fileBuffer.toString('utf-8');
  }

  // 3. Generate notes with Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = `Analyze the following document and generate structured deal notes in JSON format with the following fields: companyName, problem, solution, market, financials, risks.

${extractedText}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const dealNotes = JSON.parse(response.text());

  // 4. Save notes to Firestore
  await firestore.collection('deal-notes').add(dealNotes);

  console.log('Deal notes saved to Firestore.');
});
