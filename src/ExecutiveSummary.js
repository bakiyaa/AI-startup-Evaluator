import React from 'react';
import './ExecutiveSummary.css';

const ExecutiveSummary = ({ summary, suggestions }) => {
  if (!summary) {
    return null;
  }

  return (
    <div className="executive-summary">
      <h3>Executive Summary</h3>
      <p><strong>Recommendation:</strong> <span className="recommendation-text">{summary.recommendation}</span></p>
      <p>{summary.text}</p>
      <div className="suggestions-section">
        <h4>Suggestions</h4>
        {suggestions && suggestions.length > 0 ? (
          <ul>
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : (
          <p>No specific suggestions at this time.</p>
        )}
      </div>
    </div>
  );
};

export default ExecutiveSummary;
