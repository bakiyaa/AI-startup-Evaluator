const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const secretManagerClient = new SecretManagerServiceClient();

const { analyzeStartup } = require('./analyze-startup');
const { findPeerGroup } = require('./find-peer-group');
const { calculateBenchmarks } = require('./calculate-benchmarks');
const { processDocument } = require('./process-document');
const { vectorizeDealNote } = require('./vectorize-deal-note');

functions.http('analyze-startup-function', async (req, res) => {
    try {
        const dealNote = await analyzeStartup(req.body);
        res.status(200).send(dealNote);
    } catch (error) {
        console.error('Error analyzing startup:', error);
        res.status(500).send('An error occurred during the analysis.');
    }
});

functions.http('find-peer-group-function', async (req, res) => {
    try {
        const peerGroup = await findPeerGroup(req.body);
        res.status(200).send(peerGroup);
    } catch (error) {
        console.error('Error finding peer group:', error);
        res.status(500).send('An error occurred while finding peer group.');
    }
});

functions.http('calculate-benchmarks-function', async (req, res) => {
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



functions.cloudEvent('process-document', processDocument);

functions.http('vectorize-deal-note', vectorizeDealNote);
