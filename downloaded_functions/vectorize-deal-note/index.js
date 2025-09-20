const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');

const secretManagerClient = new SecretManagerServiceClient();
const pubsub = new PubSub();
const firestore = new Firestore();

async function getApiKey() {
  const name = 'projects/digital-shadow-417907/secrets/GEMINI_API_KEY/versions/latest';
  const [version] = await secretManagerClient.accessSecretVersion({ name });
  return version.payload.data.toString('utf8');
}

exports.vectorizeDealNote = async (cloudevent) => {
  const { projectId, fileId } = cloudevent.params;

  console.log(`Received projectId: ${projectId}, fileId: ${fileId}`);

  try {
    // 1. Get the text chunks from Firestore
    const chunksQuery = firestore.collection('projects').doc(projectId).collection('files').doc(fileId).collection('textChunks').orderBy('order');
    const chunksSnapshot = await chunksQuery.get();
    if (chunksSnapshot.empty) {
      console.log('No text chunks found for this document.');
      return;
    }
    const extractedText = chunksSnapshot.docs.map(doc => doc.data().content).join('');

    // 2. Generate embedding
    const apiKey = await getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const result = await model.embedContent(extractedText);
    const embedding = result.embedding;
    console.log('Successfully generated embedding.');

    // 3. Publish to Pub/Sub
    const topic = pubsub.topic('DownStreamAnalysis');
    const message = {
      attributes: {
        projectId: projectId,
        fileId: fileId,
      },
      data: Buffer.from(JSON.stringify({ embedding })),
    };
    await topic.publishMessage(message);
    console.log('Successfully published message to Pub/Sub.');

  } catch (error) {
    console.error('Error generating embedding or publishing to Pub/Sub:', error);
  }
};