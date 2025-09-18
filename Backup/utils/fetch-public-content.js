const axios = require('axios');

async function fetchPublicContent(urls) {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await axios.get(url);
        return `Content from ${url}:\n${response.data}`;
      } catch (error) {
        return `Failed to fetch ${url}: ${error.message}`;
      }
    })
  );
  return results.join('\n\n');
}

module.exports = { fetchPublicContent };