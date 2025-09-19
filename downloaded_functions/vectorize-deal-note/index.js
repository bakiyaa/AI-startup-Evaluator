const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');

const secretManagerClient = new SecretManagerServiceClient();
const pubsub = new PubSub();

async function getApiKey() {
  const name = 'projects/digital-shadow-417907/secrets/GEMINI_API_KEY/versions/latest';
  const [version] = await secretManagerClient.accessSecretVersion({ name });
  return version.payload.data.toString('utf8');
}

exports.vectorizeDealNote = async (cloudevent) => {
  const { value } = cloudevent.data;
  const { extractedText } = value.fields;
  const documentId = cloudevent.document;

  if (!extractedText || !extractedText.stringValue) {
    console.log('No extractedText found in the document.');
    return;
  }

  console.log(`Received documentId: ${documentId}`);

  try {
    const apiKey = await getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "embedding-001"});

    const result = await model.embedContent(extractedText.stringValue);
    const embedding = result.embedding;
    console.log('Successfully generated embedding.');

    const topic = pubsub.topic('new-document-ready');
    const message = {
      attributes: {
        documentId: documentId,
      },
      data: Buffer.from(JSON.stringify({ embedding })),
    };
    await topic.publishMessage(message);
    console.log('Successfully published message to Pub/Sub.');

  } catch (error) {
    console.error('Error generating embedding or publishing to Pub/Sub:', error);
  }
};