const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { VertexAI } = require('@google-cloud/vertexai');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const secretManagerClient = new SecretManagerServiceClient();
const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

// Helper function to retrieve secret from Secret Manager
async function getSecret(secretName) {
    const [version] = await secretManagerClient.accessSecretVersion({
        name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
}

/**
 * Takes a deal note (text) and generates vector embeddings using a text embedding model.
 * Triggered by an HTTP request.
 *
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 */
exports.vectorizeDealNote = async (req, res) => {
    const { dealNoteText, startupId } = req.body;

    if (!dealNoteText) {
        res.status(400).send('Missing dealNoteText in request body.');
        return;
    }

    console.log(`Vectorizing deal note for startup: ${startupId || 'N/A'}`);

    try {
        // Retrieve Gemini API Key from Secret Manager
        const geminiApiKey = await getSecret(process.env.GEMINI_API_SECRET_NAME);
        console.log('Gemini API Key (first 5 chars):', geminiApiKey.substring(0, 5));

        // Initialize Vertex AI
        const vertex_ai = new VertexAI({
            project: process.env.GCP_PROJECT_ID,
            location: process.env.GCP_REGION,
        });

        // Use the text-embedding-gecko@003 model
        const model = vertex_ai.getGenerativeModel({
            model: 'text-embedding-gecko@003',
        });

        // Generate embeddings
        const embeddingResponse = await model.embedContent({
            content: {
                dataType: 'TEXT',
                value: dealNoteText,
            },
        });

        const embedding = embeddingResponse.embedding;

        // Get access token for Vertex AI Index API
        const accessToken = await auth.getAccessToken();

        // Construct Vertex AI Index API URL
        const indexEndpoint = `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_REGION}/indexes/${process.env.INDEX_ENDPOINT_ID}`;
        const upsertUrl = `https://${process.env.GCP_REGION}-aiplatform.googleapis.com/v1/${indexEndpoint}:upsertDatapoints`;

        // Prepare datapoints payload
        const datapoints = [{
            datapoint_id: startupId, // Unique ID for the datapoint
            feature_vector: embedding.values, // The actual array of numbers from the embedding
        }];

        // Make POST request to upsert datapoints
        await axios.post(upsertUrl, { datapoints }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Embeddings stored in Vertex AI Index.');

        res.status(200).json({
            message: 'Deal note vectorized successfully.',
            embedding: embedding,
        });

    } catch (error) {
        console.error('Error in vectorizeDealNote:', error);
        res.status(500).send('Failed to vectorize deal note.');
    }
};
