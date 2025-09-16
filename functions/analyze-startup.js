const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateBenchmarks } = require('./calculate-benchmarks');
const { findPeerGroup } = require('./find-peer-group');
const { Storage } = require('@google-cloud/storage');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { SpeechClient } = require('@google-cloud/speech');
const { VideoIntelligenceServiceClient } = require('@google-cloud/video-intelligence');
const { Firestore } = require('@google-cloud/firestore');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Initialize Google Cloud clients
const firestore = new Firestore();

// Initialize Google Cloud clients
const storage = new Storage();
const visionClient = new ImageAnnotatorClient();
const speechClient = new SpeechClient();
const videoIntelligenceClient = new VideoIntelligenceServiceClient();
const bucketName = 'digital-shadow-417907.appspot.com';

async function getProcessedDocumentsText(fileNames) {
  if (!fileNames || fileNames.length === 0) {
    return '';
  }

  let allProcessedText = [];
  for (const fileName of fileNames) {
    const startupId = fileName.split('.')[0]; // Assuming startupId is fileName without extension
    const docRef = firestore.collection('startupAnalyses').doc(startupId);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data.extractedText) {
        allProcessedText.push(data.extractedText);
      }
    } else {
      console.warn(`No processed data found for file: ${fileName}`);
    }
  }
  return allProcessedText.join('\n\n'); // Join with double newline for readability
}

async function getStartupMetrics(processedDocumentsText) {
  if (!processedDocumentsText) {
    return { funding_total_usd: 0, funding_rounds: 0 };
  }

  const prompt = `
    Extract the following key metrics from the text provided below. Return the answer in a valid JSON format.
    The JSON object should have these keys: "funding_total_usd" and "funding_rounds".

    - "funding_total_usd": The total funding amount in USD. This should be an integer.
    - "funding_rounds": The total number of funding rounds. This should be an integer.

    If a value is not found, default to 0.

    **Text:**
    ${processedDocumentsText}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error extracting startup metrics:', error);
    return { funding_total_usd: 0, funding_rounds: 0 };
  }
}

async function analyzeStartup(data) {
  console.log('Received data in analyzeStartup:', JSON.stringify(data, null, 2));
  const { weights, userComments, filters, domain, uploadedFileNames } = data;

  // 1. Process Uploaded Documents
  const processedDocumentsText = await getProcessedDocumentsText(uploadedFileNames || []);
  
  // 2. Extract Startup Metrics
  const startupMetrics = await getStartupMetrics(processedDocumentsText);

  // 3. Construct the prompt for the main analysis
  const prompt = `
    Analyze the following startup based on the provided information and generate a structured Deal Note in JSON format.

    **Startup Name:** ${domain || '[Extract from documents]'}
    
    **User-defined Weights:**
    - Founder-Market Fit: ${weights.founderMarketFit}%
    - Problem & Market: ${weights.problemAndMarket}%
    - Differentiation: ${weights.differentiation}%
    - Traction: ${weights.traction}%

    **Analyst Guidance:**
    ${userComments || 'N/A'}

    **Processed Document Content:**
    ${processedDocumentsText || 'No documents provided.'}

    **Instructions:**
    Generate a JSON object representing the Deal Note with the following schema:
    {
      "startupName": "[Extracted from input or documents]",
      "sector": "[Industry classification]",
      "founderMarketFit": {
        "score": "[Score out of 10]",
        "justification": "[Justification based on LinkedIn profiles, prior experience, and relevance]"
      },
      "marketSize": {
        "tam": "[Estimated TAM]",
        "source": "[Source from public reports or Kaggle]"
      },
      "differentiation": "[Summary of product uniqueness, IP, and competitive moat]",
      "traction": "[Signals such as hiring velocity, web traffic, social engagement + Benchmarks]",
      "financials": "[Estimated revenue, cost structure + Peer comparisons]",
      "risks": [
        {
          "severity": "[High, Medium, or Low]",
          "text": "[Flags such as inconsistent metrics, inflated claims, lack of validation]",
          "sources": "[Array of source names]"
        }
      ],
      "recommendation": {
        "summary": "[Summary of the investment recommendation]",
        "weightedScore": "[Weighted score based on investor preferences]"
      }
    }
  `;

  // 4. Call the Gemini API for the Deal Note
  let dealNote;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    dealNote = JSON.parse(text);
  } catch (error) {
    console.error('Error calling Gemini API or parsing response:', error);
    dealNote = {
      startupName: domain || 'N/A',
      sector: 'N/A',
      founderMarketFit: { score: 0, justification: 'Failed to generate analysis.' },
      marketSize: { tam: 'N/A', source: 'N/A' },
      differentiation: 'N/A',
      traction: 'N/A',
      financials: 'N/A',
      risks: [{ severity: 'High', text: 'Failed to generate risk analysis.', sources: [] }],
      recommendation: { summary: 'Error in analysis.', weightedScore: 0 },
    };
  }

  // Adapt the new dealNote structure to the format expected by the UI components
  const diligence = [
    { criterion: 'Founder-Market Fit', score: dealNote.founderMarketFit.score, justification: dealNote.founderMarketFit.justification, evidence: [] },
    { criterion: 'Market Size', score: null, justification: `TAM: ${dealNote.marketSize.tam} (Source: ${dealNote.marketSize.source})`, evidence: [] },
    { criterion: 'Differentiation', score: null, justification: dealNote.differentiation, evidence: [] },
    { criterion: 'Traction', score: null, justification: dealNote.traction, evidence: [] },
    { criterion: 'Financials', score: null, justification: dealNote.financials, evidence: [] },
  ];

  // 5. Find Peer Group and Calculate Benchmarks
  const peerGroup = await findPeerGroup({ startupName: domain, filters });
  const benchmarks = await calculateBenchmarks({ peerGroup, startupMetrics });

  // 6. Combine all results
  const analysisResults = {
    summary: { recommendation: dealNote.recommendation.summary, text: `Weighted Score: ${dealNote.recommendation.weightedScore}` },
    suggestions: ['Focus on user acquisition.', 'Expand the team.'],
    diligence: diligence,
    benchmarks: benchmarks,
    risks: dealNote.risks,
    forecasting: { /* Placeholder */ },
    dataRoom: { /* Placeholder */ },
  };

  return analysisResults;
}

exports.analyzeStartupFunction = async (req, res) => {
  // Set CORS headers for preflight requests
  // Allows requests from any origin
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  try {
    const data = req.body; // The request body contains the data for analyzeStartup
    const results = await analyzeStartup(data);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in analyzeStartupFunction:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
};
