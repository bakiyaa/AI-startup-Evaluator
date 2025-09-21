import React from 'react';
import axios from 'axios';

const QueryInterface = ({ query, setQuery, handleQuery, isLoading }) => {
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
    </div>
  );
};

export default QueryInterface;