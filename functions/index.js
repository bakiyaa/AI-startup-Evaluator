const { Storage } = require('@google-cloud/storage');
const { Vision } = require('@google-cloud/vision');
const { Firestore } = require('@google-cloud/firestore');
const { VertexAI } = require('@google-cloud/aiplatform');

// Creates a client
const storage = new Storage();
const vision = new Vision();
const firestore = new Firestore();
const vertex_ai = new VertexAI({project: process.env.GCP_PROJECT, location: 'us-central1'});

const generativeModel = vertex_ai.getGenerativeModel({
    model: 'gemini-1.0-pro-001',
});


// The name of the bucket to access.
// This will be set as an environment variable in the Cloud Function.
const bucketName = process.env.GCS_BUCKET_NAME;

exports.generateSignedUrl = async (req, res) => {
  // These options will allow temporary uploading of the file with a PUT request.
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: req.query.contentType,
  };

  // Get a v4 signed URL for uploading file
  const [url] = await storage
    .bucket(bucketName)
    .file(req.query.fileName)
    .getSignedUrl(options);

  res.set('Access-Control-Allow-Origin', '*');
  res.send({ url });
};

exports.processDocument = async (event, context) => {
  const file = event;
  const bucketName = file.bucket;
  const fileName = file.name;
  const contentType = file.contentType;

  console.log(`Processing file: ${fileName}`);

  let text;

  if (contentType === 'application/pdf') {
    const [result] = await vision.textDetection(`gs://${bucketName}/${fileName}`);
    text = result.fullTextAnnotation.text;
  } else if (contentType.startsWith('text/')) {
    const [contents] = await storage.bucket(bucketName).file(fileName).download();
    text = contents.toString();
  } else {
    console.log(`Unsupported file type: ${contentType}`);
    return;
  }

  const prompt = `
    Analyze the following startup document and provide a summary in the following JSON format:
    {
      "companyName": "...",
      "problem": "...",
      "solution": "...",
      "market": "...",
      "team": "...",
      "financials": "...",
      "risks": "..."
    }

    Document content:
    ${text}
  `;

  const request = {
    contents: [{role: 'user', parts: [{text: prompt}]}],
  };

  const resp = await generativeModel.generateContent(request);
  const analysis = JSON.parse(resp.response.candidates[0].content.parts[0].text);

  const collectionName = process.env.FIRESTORE_COLLECTION_NAME;
  await firestore.collection(collectionName).add({
    fileName: fileName,
    analysis: analysis,
    createdAt: new Date(),
  });

  console.log(`Successfully analyzed and stored results for ${fileName}`);
};
