import React from 'react';
import './InsightDashboard.css';
import ExecutiveSummary from './ExecutiveSummary';
import RiskAnalysis from './RiskAnalysis';
import Benchmarking from './Benchmarking';

const InsightDashboard = ({ isAnalyzing, analysisStage, analysisResults, gapAnalysisQuestions, handleSendForm, handleAnalyzeAnyway }) => {

  const renderContent = () => {
    if (isAnalyzing && analysisStage !== 'formSent') {
      return <div className="loading-spinner">Analyzing...</div>; // Use a class for styling
    }

    switch (analysisStage) {
      case 'needsApproval':
        return (
          <div className="gap-analysis-approval card">
            <h4>AI Gap Analysis Complete</h4>
            <p>The AI has identified missing information. For a more accurate analysis, we recommend requesting these details from the founder.</p>
            <ul className="gap-questions">
              {gapAnalysisQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
            <div className="approval-actions">
              <button onClick={handleSendForm} className="action-button primary-action">Send Google Form</button>
              <button onClick={() => alert('AI Voice Call feature coming soon!')} className="action-button">Schedule AI Voice Call</button>
              <button onClick={handleAnalyzeAnyway} className="action-button secondary-action">Analyze with Existing Data</button>
            </div>
          </div>
        );
      case 'formSent':
        return <div className="card"><p>Form has been sent. Waiting for founder to respond before completing final analysis...</p></div>;
      case 'finalReport':
        if (!analysisResults) return <div className="card"><p>Something went wrong during the analysis.</p></div>;
        // In a real app, you would have tabs here to switch between different report sections
        return (
          <div>
            <ExecutiveSummary summary={analysisResults.summary} />
            {/* You would add other components like RiskAnalysis, Benchmarking here, perhaps in their own cards */}
          </div>
        );
      case 'initial':
      default:
        return <div className="card"><p>Click "Generate Insights" in the Analysis Workspace to start.</p></div>;
    }
  };

  return (
    <div className="insight-dashboard">
      {renderContent()}
    </div>
  );
};

export default InsightDashboard;
