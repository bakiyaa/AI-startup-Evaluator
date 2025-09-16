const express = require('express');
const app = express();
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const secretManagerClient = new SecretManagerServiceClient();

const { analyzeStartup } = require('./analyze-startup');
const { findPeerGroup } = require('./find-peer-group');
const { calculateBenchmarks } = require('./calculate-benchmarks');
const { processDocument } = require('./process-document');
const { vectorizeDealNote } = require('./vectorize-deal-note');

app.use(express.json()); // Enable JSON body parsing

// CORS middleware for all routes
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }
    next();
});

app.post('/analyze-startup-function', async (req, res) => {
    try {
        const dealNote = await analyzeStartup(req.body);
        res.status(200).send(dealNote);
    } catch (error) {
        console.error('Error analyzing startup:', error);
        res.status(500).send('An error occurred during the analysis.');
    }
});

app.post('/find-peer-group-function', async (req, res) => {
    try {
        const peerGroup = await findPeerGroup(req.body);
        res.status(200).send(peerGroup);
    } catch (error) {
        console.error('Error finding peer group:', error);
        res.status(500).send('An error occurred while finding peer group.');
    }
});

app.post('/calculate-benchmarks-function', async (req, res) => {
    try {
        const benchmarks = await calculateBenchmarks(req.body);
        res.status(200).send(benchmarks);
    } catch (error) {
        console.error('Error calculating benchmarks:', error);
        res.status(500).send('An error occurred while calculating benchmarks.');
    }
});

// Helper function to retrieve secret from Secret Manager
async function getSecret(secretName) {
    const [version] = await secretManagerClient.accessSecretVersion({
        name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
}

// Note: CloudEvent functions like 'process-document' and 'vectorize-deal-note'
// are typically deployed separately as Cloud Functions, not as part of an Express app
// for Cloud Run. If these are also intended for Cloud Run, they would need
// their own HTTP endpoints. For now, I'm assuming the error is specific to
// 'analyze-startup-function' and the HTTP-triggered functions.

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});