const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Firestore } = require('@google-cloud/firestore');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const { Pool } = require('pg');

const secretManagerClient = new SecretManagerServiceClient();
const firestore = new Firestore();

async function getApiKey() {
  const name = 'projects/digital-shadow-417907/secrets/GEMINI_API_KEY/versions/latest';
  const [version] = await secretManagerClient.accessSecretVersion({ name });
  return version.payload.data.toString('utf8');
}

// Late-initialized pool, to be initialized on first function execution.
let pool;

exports.vectorizeDealNote = async (cloudevent) => {
  const { projectId, fileId } = cloudevent.params;

  console.log(`Received projectId: ${projectId}, fileId: ${fileId}`);

  let actualFileId = fileId;
  if (fileId.includes('/')) {
    actualFileId = fileId.split('/').pop();
  }

  try {
    // 1. Get the text chunks from Firestore
    const chunksQuery = firestore.collection('projects').doc(projectId).collection('files').doc(actualFileId).collection('textChunks').orderBy('order');
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

    // 3. Store embedding in Cloud SQL
    if (!pool) {
      const connector = new Connector();
      const clientOpts = await connector.getOptions({
        instanceConnectionName: process.env.DB_HOST,
      });
      pool = new Pool({
        ...clientOpts,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
      });
    }

    const client = await pool.connect();
    const query = 'INSERT INTO deal_notes (file_id, embedding) VALUES ($1, $2) ON CONFLICT (file_id) DO UPDATE SET embedding = $2';
    // pgvector expects the vector in the format '[1,2,3]'
    const embeddingString = `[${embedding.values.join(',')}]`;
    const values = [actualFileId, embeddingString];
    await client.query(query, values);
    client.release();
    console.log('Successfully stored embedding in Cloud SQL.');

  } catch (error) {
    console.error('Error generating embedding or storing in Cloud SQL:', error);
  }
};
