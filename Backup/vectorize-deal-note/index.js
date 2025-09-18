const { VertexAI } = require('@google-cloud/vertexai');

/**
 * Generates vector embeddings for a given text using a Vertex AI model.
 * This is an HTTP-triggered function designed to be called by a Cloud Workflow.
 *
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 */
exports.vectorizeDealNote = async (req, res) => {
    const { text } = req.body;

    if (!text) {
        res.status(400).send('Missing "text" property in request body.');
        return;
    }

    console.log(`Vectorizing text...`);

    try {
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
                value: text,
            },
        });

        const embedding = embeddingResponse.embedding;

        if (!embedding || !embedding.values) {
            throw new Error('Invalid embedding response from model.');
        }

        console.log('Successfully generated embedding.');

        res.status(200).json(embedding.values);

    } catch (error) {
        console.error('Error in vectorizeDealNote:', error);
        res.status(500).send(`Failed to vectorize text: ${error.message}`);
    }
};
