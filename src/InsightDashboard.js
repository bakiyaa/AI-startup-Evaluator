import React, { useState } from 'react';
import axios from 'axios';
import './InsightDashboard.css';
import ExecutiveSummary from './ExecutiveSummary';
import Benchmarking from './Benchmarking';
import Graphs from './Graphs';
import DealNotes from './DealNotes';
import QueryInterface from './components/QueryInterface';

const InsightDashboard = ({ isAnalyzing, analysisStage, analysisResults, gapAnalysisQuestions, handleSendForm, handleAnalyzeAnyway }) => {
  const [activeTab, setActiveTab] = useState('summary');
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

  const renderContent = () => {
    if (isAnalyzing && analysisStage !== 'formSent') {
      return <div className="loading-spinner">Analyzing...</div>;
    }

    // Mock data for benchmarking to illustrate the component
    const mockBenchmarkData = [
      { name: 'TAM', startup: 500, peerAverage: 450, topPeer: 600 },
      { name: 'CAC', startup: 120, peerAverage: 150, topPeer: 100 },
      { name: 'LTV', startup: 800, peerAverage: 700, topPeer: 950 },
      { name: 'Burn Rate', startup: 50, peerAverage: 70, topPeer: 40 },
    ];

    const results = analysisResults || {};

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
      case 'initial': // Also show tabs in initial state
      default:
        return (
          <div>
            <div className="tabs">
              <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Executive Summary</button>
              <button className={activeTab === 'benchmarking' ? 'active' : ''} onClick={() => setActiveTab('benchmarking')}>Benchmarking</button>
              <button className={activeTab === 'graphs' ? 'active' : ''} onClick={() => setActiveTab('graphs')}>Graphs</button>
              <button className={activeTab === 'dealNotes' ? 'active' : ''} onClick={() => setActiveTab('dealNotes')}>Deal Notes</button>
            </div>
            <div className="tab-content">
              {activeTab === 'summary' && <ExecutiveSummary summary={response ? response.answer : results.summary} />}
              {activeTab === 'benchmarking' && <Benchmarking benchmarkData={results.benchmarkData || mockBenchmarkData} />}
              {activeTab === 'graphs' && <Graphs />}
              {activeTab === 'dealNotes' && <DealNotes />}
            </div>
            <QueryInterface query={query} setQuery={setQuery} handleQuery={handleQuery} isLoading={isLoading} />
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
    }
  };

  return (
    <div className="insight-dashboard">
      {renderContent()}
    </div>
  );
};

export default InsightDashboard;
