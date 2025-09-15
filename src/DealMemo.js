import React from 'react';
import RiskAnalysis from './RiskAnalysis';
import DealNotes from './DealNotes';

const DealMemo = () => {
  // In the future, this component will receive analysis results as props.
  const mockResults = {
    summary: 'This is a promising startup with a strong team, but they face significant market competition.',
    recommendation: 'Proceed with caution. Recommend further due diligence on customer acquisition strategy.',
    risks: [
      { severity: 'High', text: 'Intense competition from established players.' },
      { severity: 'Medium', text: 'Customer acquisition cost may be higher than projected.' },
    ]
  };

  return (
    <div className="deal-memo">
      <h2>Deal Memo</h2>
      
      <div className="card">
        <h3>Summary & Recommendation</h3>
        <p><strong>Recommendation:</strong> {mockResults.recommendation}</p>
        <p>{mockResults.summary}</p>
      </div>

      <RiskAnalysis riskData={mockResults.risks} />
      <DealNotes />
    </div>
  );
};

export default DealMemo;
