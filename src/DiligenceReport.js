import React from 'react';

const DiligenceReport = ({ diligence }) => {
  if (!diligence) {
    return <p>No diligence report available.</p>;
  }

  return (
    <div className="diligence-report">
      <h3>Diligence Report</h3>
      {/* Placeholder for detailed diligence breakdown */}
      {diligence.map((item, index) => (
        <div key={index} className="diligence-item">
          <h4>{item.criterion}</h4>
          <p><strong>Score:</strong> {item.score}</p>
          <p>{item.justification}</p>
          {item.evidence && (
            <div className="evidence">
              <h5>Evidence:</h5>
              <ul>
                {item.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DiligenceReport;