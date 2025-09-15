import React, { useState } from 'react';
import './Insights.css';
import Controls from './Controls';
import Benchmarking from './Benchmarking';
import RiskAnalysis from './RiskAnalysis';
import ExecutiveSummary from './ExecutiveSummary';
import DiligenceReport from './DiligenceReport';

const InsightsWorkspace = () => {
  const [weights, setWeights] = useState({ founderMarketFit: 50, problemAndMarket: 25, differentiation: 15, traction: 10 });
  const [userComments, setUserComments] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('initial'); // initial, needsApproval, formSent, finalReport
  const [analysisResults, setAnalysisResults] = useState(null);
  const [gapAnalysisQuestions, setGapAnalysisQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisStage('initial');
    setAnalysisResults(null);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock API: Randomly decide if data is sufficient
    if (Math.random() > 0.5) {
      setGapAnalysisQuestions(["What is the estimated monthly burn rate?", "Can you provide more details on the competitive landscape?"]);
      setAnalysisStage('needsApproval');
    } else {
      setAnalysisResults({ summary: { recommendation: 'Pass (Mock)', text: 'Analysis based on initial data. Key metrics are missing.' }, risks: [{ severity: 'High', text: 'Critical financial data missing.' }] });
      setAnalysisStage('finalReport');
    }
    setIsAnalyzing(false);
  };

  const handleSendForm = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAnalysisStage('formSent');
    setIsAnalyzing(false);

    setTimeout(() => {
      setIsAnalyzing(true);
      new Promise(resolve => setTimeout(resolve, 2000)).then(() => {
        setAnalysisResults({ summary: { recommendation: 'Invest (Mock)', text: 'Analysis based on augmented data from form.' }, risks: [{ severity: 'Low', text: 'Risks were mitigated with new data.' }] });
        setAnalysisStage('finalReport');
        setIsAnalyzing(false);
      });
    }, 3000);
  };

  const handleAnalyzeAnyway = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAnalysisResults({ summary: { recommendation: 'Pass (Mock)', text: 'Analysis based on initial data. Key metrics are missing.' }, risks: [{ severity: 'High', text: 'Critical financial data missing.' }] });
    setAnalysisStage('finalReport');
    setIsAnalyzing(false);
  };

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
          case 'summary': return <ExecutiveSummary summary={analysisResults.summary} />;
          case 'diligence': return <DiligenceReport diligence={analysisResults.diligence} />;
          case 'benchmarking': return <Benchmarking benchmarkData={analysisResults.benchmarks} />;
          case 'risks': return <RiskAnalysis riskData={analysisResults.risks} />;
          default: return null;
        }
      case 'initial':
      default:
        return <p>Click "Generate Insights" to start the analysis.</p>;
    }
  };

  return (
    <div className="insights-workspace">
      <Controls weights={weights} setWeights={setWeights} userComments={userComments} setUserComments={setUserComments} handleAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      <div className="results-panel card">
        {analysisStage === 'finalReport' && (
          <div className="tabs">
            <button onClick={() => setActiveTab('summary')} className={activeTab === 'summary' ? 'active' : ''}>Executive Summary</button>
            <button onClick={() => setActiveTab('diligence')} className={activeTab === 'diligence' ? 'active' : ''}>Diligence Report</button>
            <button onClick={() => setActiveTab('benchmarking')} className={activeTab === 'benchmarking' ? 'active' : ''}>Benchmarking</button>
            <button onClick={() => setActiveTab('risks')} className={activeTab === 'risks' ? 'active' : ''}>Risk Assessment</button>
          </div>
        )}
        <div className="tab-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default InsightsWorkspace;

