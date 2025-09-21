import React, { useState } from 'react';
import axios from 'axios';

const QueryInterface = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async () => {
    if (!query) {
      alert('Please enter a query.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // The URL of your rag-query-service.
      // We will get this from an environment variable in a later step.
      const queryServiceUrl = process.env.REACT_APP_RAG_QUERY_SERVICE_URL || 'http://localhost:8080/query';

      const res = await axios.post(queryServiceUrl, { query });
      setResponse(res.data);
    } catch (err) {
      setError('An error occurred while processing your query.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="query-interface">
      <h2>Ask a Question</h2>
      <div className="query-input">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., What are the main risks for this startup?"
        />
        <button onClick={handleQuery} disabled={isLoading}>
          {isLoading ? 'Asking...' : 'Ask'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {response && (
        <div className="query-response">
          <h3>Answer:</h3>
          <p>{response.answer}</p>
          {response.sources && response.sources.length > 0 && (
            <>
              <h3>Sources:</h3>
              <ul>
                {response.sources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryInterface;
