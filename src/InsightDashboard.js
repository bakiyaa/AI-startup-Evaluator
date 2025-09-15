import React, { useState } from 'react';
import './InsightDashboard.css';
import Benchmarking from './Benchmarking';
import ExecutiveSummary from './ExecutiveSummary';
import PeerGroup from './PeerGroup';

const InsightDashboard = ({
  isAnalyzing,
  analysisStage,
  analysisResults,
  gapAnalysisQuestions,
  handleSendForm,
  handleAnalyzeAnyway,
  peerGroup
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  const renderContent = () => {
    if (isAnalyzing) return <div className="spinner"></div>;

    switch (analysisStage) {
      case 'needsApproval':
        return (
          <div className="gap-analysis-approval">
            <h4>AI Gap Analysis Complete</h4>
            <p>The AI has identified missing information. For a more accurate analysis, we recommend requesting these details from the founder.</p>
            <ul>
              {gapAnalysisQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
            <div className="approval-actions">
              <button onClick={handleSendForm} className="action-button primary-action">Approve & Send Form</button>
              <button onClick={handleAnalyzeAnyway} className="action-button">Analyze with Existing Data</button>
            </div>
          </div>
        );
      case 'formSent':
        return <p>Form has been sent. Waiting for response before completing final analysis...</p>;
      case 'finalReport':
        if (!analysisResults) return <p>Something went wrong.</p>;
        switch (activeTab) {
          case 'summary': return <ExecutiveSummary summary={analysisResults.summary} suggestions={analysisResults.suggestions} />;
          case 'peer-group': return <PeerGroup peers={peerGroup} />;
          case 'benchmarking': return <Benchmarking benchmarkData={analysisResults.benchmarks} />;
          default: return null;
        }
      case 'initial':
      default:
        return <p>Click "Generate Insights" to start the analysis.</p>;
    }
  };

  return (
    <div className="insight-dashboard card">
      <h3>Insight Dashboard</h3>
      {analysisStage === 'finalReport' && (
        <div className="tabs">
          <button onClick={() => setActiveTab('summary')} className={activeTab === 'summary' ? 'active' : ''}>Summary</button>
          <button onClick={() => setActiveTab('peer-group')} className={activeTab === 'peer-group' ? 'active' : ''}>Peer Group</button>
          <button onClick={() => setActiveTab('benchmarking')} className={activeTab === 'benchmarking' ? 'active' : ''}>Benchmarking</button>
        </div>
      )}
      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default InsightDashboard;
