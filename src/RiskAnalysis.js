import React from 'react';
import './RiskAnalysis.css';

const RiskAnalysis = ({ riskData }) => {
  return (
    <div className="risk-analysis card">
      <h3>Risk Analysis</h3>
      {riskData && riskData.length > 0 ? (
        <ul>
          {riskData.map((risk, index) => (
            <li key={index} className={`risk-item severity-${risk.severity?.toLowerCase()}`}>
              <strong>{risk.severity}:</strong> {risk.text}
            </li>
          ))}
        </ul>
      ) : (
        <p>No risk analysis data available. Click "Analyze" to generate it.</p>
      )}
    </div>
  );
};

export default RiskAnalysis;
