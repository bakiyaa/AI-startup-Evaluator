import React from 'react';
import './RiskAnalysis.css';

const RiskAnalysis = ({ riskData }) => {
  return (
    <div className="risk-analysis card">
      <h3>Risk Analysis</h3>
      <div className="warning-banner">
        Warning: The AI-flagged risks are a starting point for your own due diligence, not a final conclusion.
      </div>
      {riskData && riskData.length > 0 ? (
        <ul>
          {riskData.map((risk, index) => (
            <li key={index} className={`risk-item severity-${risk.severity?.toLowerCase()}`}>
              <strong>{risk.severity}:</strong> {risk.text}
              {risk.sources && risk.sources.length > 0 && (
                <div className="risk-sources">
                  <strong>Sources:</strong> {risk.sources.join(', ')}
                </div>
              )}
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

