const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Connector } = require('@google-cloud/cloud-sql-connector');
const { Pool } = require('pg');
const { Bigtable } = require('@google-cloud/bigtable');
const { ToolboxClient } = require('@toolbox-sdk/core');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const { IndexServiceClient } = require('@google-cloud/aiplatform').v1;

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Initialize the Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Initialize Bigtable
const bigtable = new Bigtable();
const instance = bigtable.instance(process.env.BIGTABLE_INSTANCE_ID);
const table = instance.table(process.env.BIGTABLE_TABLE_ID);

// Initialize MCP Toolbox Client
const toolboxClient = new ToolboxClient(process.env.MCP_TOOLBOX_URL);

// Initialize GCS
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'ai-starter-evaluation-bucket-9pguwa';

// Initialize AI Platform Client
const aiplatformClient = new IndexServiceClient({
  apiEndpoint: 'us-central1-aiplatform.googleapis.com'
});

// Late-initialized pool, to be initialized on first function execution.
let pool;

async function getDbPool() {
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
  return pool;
}

app.post('/query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).send('Missing query in request body.');
  }

  console.log(`Received query: ${query}`);

  try {
    // 1. Vectorize the user's query
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding;
    console.log('Successfully generated query embedding.');

    // 2. Perform vector search in Cloud SQL
    const dbPool = await getDbPool();
    const client = await dbPool.connect();
    const queryEmbeddingString = `[${queryEmbedding.values.join(',')}]`;
    const dbQuery = {
      text: 'SELECT file_id, content, company_id FROM deal_notes ORDER BY embedding <=> $1 LIMIT 5',
      values: [queryEmbeddingString],
    };
    const { rows: dealNotes } = await client.query(dbQuery);
    client.release();
    console.log('Successfully performed vector search in Cloud SQL.');

    // 3. Fetch additional data from Bigtable
    const companyIds = [...new Set(dealNotes.map(note => note.company_id))];
    const [bigtableRows] = await table.getRows({
      keys: companyIds,
    });

    const companyData = {};
    for (const row of bigtableRows) {
      companyData[row.id] = row.data;
    }
    console.log('Successfully fetched data from Bigtable.');

    // 4. Load tools from MCP Toolbox
    const tools = await toolboxClient.loadToolset();
    console.log('Successfully loaded tools from MCP Toolbox.');

    // 5. Construct the prompt for the Gemini model
    const context = `
      Deal Notes:
      ${dealNotes.map(note => `- ${note.content}`).join('\n')}

      Company Data:
      ${JSON.stringify(companyData, null, 2)}
    `;
    const prompt = `
      You are an expert startup evaluator. Your task is to answer the user's query based on the provided context.

      User Query: ${query}

      Context:
      ${context}

      Answer:
    `;

    // 6. Call the Gemini model with tools
    const generativeModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      tools: tools,
    });

    const chat = generativeModel.startChat();
    let modelResult = await chat.sendMessage(prompt);
    let response = modelResult.response;

    // 7. Handle tool calls
    while (response.functionCalls) {
      const toolCalls = response.functionCalls;
      console.log(`Gemini requested to call the following tools: ${toolCalls.map(tool => tool.name).join(', ')}`);

      const toolCallResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          if (toolCall.name === 'request_missing_data') {
            console.log('Calling context-management-service to request missing data.');
            const response = await axios.post(process.env.CONTEXT_MANAGEMENT_SERVICE_URL, toolCall.args);
            return response.data;
          } else {
            return toolboxClient.executeTool(toolCall);
          }
        })
      );

      modelResult = await chat.sendMessage(JSON.stringify(toolCallResults));
      response = modelResult.response;
    }

    const answer = response.text();
    console.log('Successfully generated answer from Gemini model.');

    const finalResponse = {
      answer: answer,
      sources: dealNotes.map(note => note.file_id),
    };

    res.status(200).json(finalResponse);

  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).send('An error occurred while processing your query.');
  }
});

app.post('/api/rag/ingest', async (req, res) => {
  const { startup_id, doc_type, title, summary, tags } = req.body;

  if (!startup_id || !doc_type || !title || !summary) {
    return res.status(400).send('Missing required fields in request body.');
  }

  try {
    // 1. Write to GCS
    const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const fileName = `docs/${startup_id}/${slugify(title)}.json`;
    const file = storage.bucket(bucketName).file(fileName);
    await file.save(JSON.stringify({ title, summary, tags, doc_type }));
    const gcsUri = `gs://${bucketName}/${fileName}`;
    console.log(`Successfully uploaded to GCS: ${gcsUri}`);

    // 2. Import into RAG corpus (Vertex AI RAG Engine)
    const corpusName = process.env.RAG_CORPUS_NAME; // e.g. projects/{project}/locations/{location}/corpora/{corpus}
    if (corpusName) {
        await aiplatformClient.importRagFiles({
            parent: corpusName,
            importRagFilesConfig: {
                gcsSource: {
                    uris: [gcsUri],
                },
                importRagFilesChunkingConfig: {
                    chunkSize: 800,
                    chunkOverlap: 100,
                }
            }
        });
        console.log(`Successfully started RAG ingestion for: ${gcsUri}`);
    } else {
        console.log('RAG_CORPUS_NAME not set, skipping RAG ingestion.');
    }


    res.status(200).json({ status: 'ok', gcs_uri: gcsUri });
  } catch (error) {
    console.error('Error ingesting to RAG:', error);
    res.status(500).send('An error occurred during RAG ingestion.');
  }
});

app.listen(port, () => {
  console.log(`rag-query-service listening on port ${port}`);
});
