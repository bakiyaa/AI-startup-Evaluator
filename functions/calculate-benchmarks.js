const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

async function calculateBenchmarks(data) {
  const { peerGroup, startupMetrics } = data; // Expect peerGroup and startupMetrics
  const datasetId = 'startup_kpis';
  const tableId = 'benchmarking_data';

  if (!peerGroup || peerGroup.length === 0) {
    return []; // Return empty array if no peer group is provided
  }

  const peerNames = peerGroup.map(p => p.startup_name);

  const query = `
    SELECT
      AVG(funding_total_usd) as avg_funding_total_usd,
      AVG(funding_rounds) as avg_funding_rounds,
      MAX(funding_total_usd) as max_funding_total_usd,
      MAX(funding_rounds) as max_funding_rounds
    FROM 
      ${datasetId}.${tableId}
    WHERE startup_name IN UNNEST(@peerNames)
  `;

  const queryParams = { peerNames };

  try {
    const [rows] = await bigquery.query({
      query: query,
      params: queryParams,
    });

    const peerStats = rows[0];

    // Construct benchmark data for frontend
    const benchmarks = [
      {
        name: 'Total Funding (USD)',
        startup: startupMetrics.funding_total_usd,
        peerAverage: peerStats.avg_funding_total_usd,
        topPeer: peerStats.max_funding_total_usd
      },
      {
        name: 'Number of Funding Rounds',
        startup: startupMetrics.funding_rounds,
        peerAverage: peerStats.avg_funding_rounds,
        topPeer: peerStats.max_funding_rounds
      },
      // Add more benchmarks based on your metrics
    ];

    return benchmarks;

  } catch (error) {
    console.error('Error calculating benchmarks:', error);
    throw new Error('Failed to calculate benchmarks.');
  }
}

module.exports = { calculateBenchmarks };
