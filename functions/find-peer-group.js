const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

async function findPeerGroup(data) {
  const { startupName, filters } = data;
  const datasetId = 'startup_kpis';
  const tableId = 'benchmarking_data';

  let query = `
    SELECT
      startup_name,
      industry,
      funding_total_usd,
      country_code,
      founded_at
    FROM 
      `${datasetId}.${tableId}`
    WHERE LOWER(startup_name) != LOWER(@startupName)
  `;

  const queryParams = { startupName };

  if (filters && filters.keywords) {
    query += ` AND (LOWER(industry) LIKE LOWER(@keywords) OR LOWER(category_list) LIKE LOWER(@keywords))`;
    queryParams.keywords = `%${filters.keywords}%`;
  }

  // TODO: Add more filters here based on the 'filters' object, e.g., for country, founded_at range, etc.

  query += ` LIMIT 20`;

  try {
    const [rows] = await bigquery.query({
      query: query,
      params: queryParams,
    });
    return rows;
  } catch (error) {
    console.error('Error querying BigQuery for peer group:', error);
    throw new Error('Failed to find peer group.');
  }
}

module.exports = { findPeerGroup };

