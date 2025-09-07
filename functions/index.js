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


// Usecase 2: On-demand HTTP function to create vector embeddings for one or all documents
functions.http('vectorize-deal-note', async (req, res) => {
  const docId = req.body.docId;

  const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
  const { IndexEndpointServiceClient } = require('@google-cloud/aiplatform').v1;
  const clientOptions = { apiEndpoint: 'us-central1-aiplatform.googleapis.com' };
  const predictionServiceClient = new PredictionServiceClient(clientOptions);
  const indexEndpointServiceClient = new IndexEndpointServiceClient(clientOptions);

  const project = process.env.PROJECT_ID; // Your Google Cloud project ID
  const location = process.env.LOCATION; // e.g., 'us-central1'
  const endpointId = 'textembedding-gecko@003';
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${endpointId}`;
  const indexEndpoint = `projects/${project}/locations/${location}/indexEndpoints/${process.env.INDEX_ENDPOINT_ID}`;

  let documents = [];

  if (docId) {
    // Process a single document
    console.log(`Processing single Firestore document: ${docId}`);
    const firestoreDoc = await firestore.collection('deal-notes').doc(docId).get();
    if (firestoreDoc.exists) {
      documents.push({ id: firestoreDoc.id, data: firestoreDoc.data() });
    } else {
      return res.status(404).send('Document not found.');
    }
  } else {
    // Process all documents
    console.log('Processing all documents in deal-notes collection.');
    const snapshot = await firestore.collection('deal-notes').get();
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, data: doc.data() });
    });
  }

  if (documents.length === 0) {
    return res.status(200).send('No documents to process.');
  }

  try {
    for (const doc of documents) {
      const noteData = doc.data;
      const textToEmbed = `Company: ${noteData.companyName}. Problem: ${noteData.problem}. Solution: ${noteData.solution}. Market: ${noteData.market}.`;

      const [response] = await predictionServiceClient.predict({
        endpoint,
        instances: [{ content: textToEmbed }],
      });

      const embedding = response.predictions[0].structValue.fields.embedding.listValue.values.map(v => v.numberValue);

      await indexEndpointServiceClient.upsertDatapoints({
        indexEndpoint,
        datapoints: [
          {
            datapointId: doc.id,
            featureVector: embedding,
          },
        ],
      });
      console.log(`Vector embedding upserted for document: ${doc.id}`);
    }
    res.status(200).send(`Successfully processed ${documents.length} document(s).`);
  } catch (error) {
    console.error('Error during vectorization:', error);
    res.status(500).send('An error occurred during vectorization.');
  }
});
