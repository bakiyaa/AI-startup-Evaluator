import React, { useState } from 'react';
import './InvestmentAnalystPage.css';
import Header from './Header';
import DealInformation from './DealInformation';
import Controls from './Controls';
import InsightDashboard from './InsightDashboard';
import DataRoom from './DocumentViewer';

const InvestmentAnalystPage = () => {
  const [activeTab, setActiveTab] = useState('workspace');

  // State lifted from children components
  const [weights, setWeights] = useState({ founderMarketFit: 30, problemAndMarket: 25, differentiation: 20, traction: 25 });
  const [userComments, setUserComments] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('initial');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [gapAnalysisQuestions, setGapAnalysisQuestions] = useState([]);
  const [filters, setFilters] = useState({ stage: 'seed' });
  const [domain, setDomain] = useState('');
  const [uploadedFileNames, setUploadedFileNames] = useState([]);

  const [analysisMode, setAnalysisMode] = useState('filtered');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysisStage('initial');
    setAnalysisResults(null);
    setGapAnalysisQuestions([]);
    setActiveTab('insights'); // Switch to insights tab

    // Simulate initial analysis
    setTimeout(() => {
      if (Math.random() > 0.3) { // 70% chance to find a gap
        setGapAnalysisQuestions([
          'What is the estimated monthly burn rate?',
          'Can you provide more details on the competitive landscape?',
          'What is the customer acquisition cost (CAC)?'
        ]);
        setAnalysisStage('needsApproval');
      } else {
        setAnalysisResults({ summary: { recommendation: 'Invest', text: 'Strong team and market position.' } });
        setAnalysisStage('finalReport');
      }
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSendForm = () => {
    setAnalysisStage('formSent');
    setTimeout(() => {
      setIsAnalyzing(true);
      setTimeout(() => {
        setAnalysisResults({ summary: { recommendation: 'Strong Invest', text: 'Analysis based on augmented data. All previous concerns addressed.' } });
        setAnalysisStage('finalReport');
        setIsAnalyzing(false);
      }, 2000);
    }, 5000);
  };

  const handleAnalyzeAnyway = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisResults({ summary: { recommendation: 'Pass', text: 'Analysis based on incomplete data. Key metrics are missing, proceed with caution.' } });
      setAnalysisStage('finalReport');
      setIsAnalyzing(false);
    }, 2000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'insights':
        return (
          <InsightDashboard 
            isAnalyzing={isAnalyzing}
            analysisStage={analysisStage}
            analysisResults={analysisResults}
            gapAnalysisQuestions={gapAnalysisQuestions}
            handleSendForm={handleSendForm}
            handleAnalyzeAnyway={handleAnalyzeAnyway}
          />
        );
      case 'dataroom':
        return <DataRoom />;
      case 'workspace':
      default:
        return (
          <div className="workspace-grid">
            <DealInformation 
              filters={filters}
              handleFilterChange={handleFilterChange}
              onDomainChange={setDomain}
              onFilesChange={setUploadedFileNames}
              handleFindPeerGroup={() => {}}
            />
            <Controls 
              weights={weights} 
              setWeights={setWeights} 
              userComments={userComments} 
              setUserComments={setUserComments} 
              handleAnalyze={handleAnalyze} 
              isAnalyzing={isAnalyzing}
              analysisMode={analysisMode}
              setAnalysisMode={setAnalysisMode}
            />
          </div>
        );
    }
  };

  return (
    <div className="investment-analyst-page">
      <Header />
      <div className="tabs-container">
        <button onClick={() => setActiveTab('workspace')} className={activeTab === 'workspace' ? 'active' : ''}>Analysis Workspace</button>
        <button onClick={() => setActiveTab('insights')} className={activeTab === 'insights' ? 'active' : ''}>Insight Dashboard</button>
        <button onClick={() => setActiveTab('dataroom')} className={activeTab === 'dataroom' ? 'active' : ''}>Data Room</button>
      </div>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default InvestmentAnalystPage;
