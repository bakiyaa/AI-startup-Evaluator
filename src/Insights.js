import React from 'react';
import './Insights.css';
import Benchmarking from './Benchmarking';
import RiskAnalysis from './RiskAnalysis';

const Insights = ({ isAnalyzing, results }) => {

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="card">
          <p>Generating... Please wait.</p>
          {/* TODO: Add a spinner here for better UX */}
        </div>
      );
    }

    if (results && results.error) {
        return (
            <div className="card error-message">
                <p>Error: {results.error}</p>
            </div>
        );
    }

    if (results) {
      return (
        <>
          <div className="card">
            <h3>Summary & Recommendation</h3>
            <p><strong>Recommendation:</strong> {results.recommendation}</p>
            <p>{results.summary}</p>
          </div>
          <Benchmarking benchmarkData={results.benchmarks} />
          <RiskAnalysis riskData={results.risks} />
        </>
      );
    }

    return (
      <div className="card initial-prompt">
        <p>No analysis yet. Click Generate Insights.</p>
      </div>
    );
  };

  return (
    <div className="insights-panel">
      <h3>Latest Result</h3>
      {renderContent()}
    </div>
  );
};

export default Insights;
