import React, { useState } from 'react';
import './InvestmentAnalystPage.css';
import Header from './Header';
import DealInformation from './DealInformation';
import Controls from './Controls';
import InsightDashboard from './InsightDashboard';
import DataRoom from './DocumentViewer';
import PeerGroup from './PeerGroup';

const InvestmentAnalystPage = () => {
  const [weights, setWeights] = useState({ founderMarketFit: 50, problemAndMarket: 25, differentiation: 15, traction: 10 });
  const [userComments, setUserComments] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('initial');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [gapAnalysisQuestions, setGapAnalysisQuestions] = useState([]);
  const [analysisMode, setAnalysisMode] = useState('semantic'); // semantic or filtered
  const [filters, setFilters] = useState({
    keywords: '',
    publicUrls: '',
    eventDate: '',
    eventDescription: ''
  });
  const [domain, setDomain] = useState('');
  const [peerGroup, setPeerGroup] = useState([]);
  const [uploadedFileNames, setUploadedFileNames] = useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleFilesChange = (fileNames) => {
    setUploadedFileNames(fileNames);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisStage('initial');
    setAnalysisResults(null);
    setGapAnalysisQuestions([]);

    const functionUrl = 'https://us-central1-digital-shadow-417907.cloudfunctions.net/analyze-startup-function';

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weights,
          userComments,
          filters,
          domain,
          uploadedFileNames,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResults = await response.json();

      setAnalysisResults({
        summary: backendResults.summary,
        suggestions: backendResults.suggestions,
        diligence: backendResults.diligence,
        benchmarks: backendResults.benchmarks,
        risks: backendResults.risks,
        forecasting: backendResults.forecasting,
        dataRoom: backendResults.dataRoom,
      });

      if (backendResults.gapAnalysisQuestions && backendResults.gapAnalysisQuestions.length > 0) {
        setGapAnalysisQuestions(backendResults.gapAnalysisQuestions);
        setAnalysisStage('needsApproval');
      } else {
        setAnalysisStage('finalReport');
      }

    } catch (error) {
      console.error('Error analyzing startup:', error);
      setAnalysisResults({ summary: { recommendation: 'Error', text: `Analysis failed: ${error.message}` } });
      setAnalysisStage('finalReport');
    }
    setIsAnalyzing(false);
  };

  const handleSendForm = async () => {
    setIsAnalyzing(true);
    const sendFormFunctionUrl = 'https://us-central1-digital-shadow-417907.cloudfunctions.net/send-gap-analysis-form'; // Placeholder URL
    console.log('Calling backend to send form...', sendFormFunctionUrl);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnalysisStage('formSent');
      setIsAnalyzing(false);

      setTimeout(async () => {
        setIsAnalyzing(true);
        const functionUrl = 'https://us-central1-digital-shadow-417907.cloudfunctions.net/analyze-startup-function';
        try {
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              weights,
              userComments,
              filters,
              domain,
              augmentedDataAvailable: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const backendResults = await response.json();

          setAnalysisResults({
            summary: backendResults.summary,
            suggestions: backendResults.suggestions,
            diligence: backendResults.diligence,
            benchmarks: backendResults.benchmarks,
            risks: backendResults.risks,
            forecasting: backendResults.forecasting,
            dataRoom: backendResults.dataRoom,
          });
          setAnalysisStage('finalReport');
        } catch (error) {
          console.error('Error during re-analysis after form sent:', error);
          setAnalysisResults({ summary: { recommendation: 'Error', text: `Re-analysis failed: ${error.message}` } });
          setAnalysisStage('finalReport');
        }
        setIsAnalyzing(false);
      }, 3000);

    } catch (error) {
      console.error('Error sending form:', error);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAnyway = async () => {
    setIsAnalyzing(true);
    const functionUrl = 'https://us-central1-digital-shadow-417907.cloudfunctions.net/analyze-startup-function';

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weights,
          userComments,
          filters,
          domain,
          proceedWithoutGapAnalysis: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const backendResults = await response.json();

      setAnalysisResults({
        summary: backendResults.summary,
        suggestions: backendResults.suggestions,
        diligence: backendResults.diligence,
        benchmarks: backendResults.benchmarks,
        risks: backendResults.risks,
        forecasting: backendResults.forecasting,
        dataRoom: backendResults.dataRoom,
      });
      setAnalysisStage('finalReport');

    } catch (error) {
      console.error('Error analyzing anyway:', error);
      setAnalysisResults({ summary: { recommendation: 'Error', text: `Analysis failed: ${error.message}` } });
      setAnalysisStage('finalReport');
    }
    setIsAnalyzing(false);
  };

  const handleFindPeerGroup = async () => {
    console.log("Finding peer group with filters...", filters);
    const functionUrl = 'https://us-central1-digital-shadow-417907.cloudfunctions.net/find-peer-group';

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const peerGroup = await response.json();
      console.log('Peer group found:', peerGroup);
      setPeerGroup(peerGroup);
    } catch (error) {
      console.error('Error finding peer group:', error);
    }
  };

  return (
    <div className="investment-analyst-page">
      <Header />
      <main className="main-content">
        <div className="left-column">
          <DealInformation 
            handleFindPeerGroup={handleFindPeerGroup} 
            filters={filters}
            handleFilterChange={handleFilterChange}
            onDomainChange={setDomain}
            onFilesChange={handleFilesChange}
          />
          <DataRoom dataRoomData={analysisResults?.dataRoom} />
        </div>
        <div className="right-column">
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
          <InsightDashboard 
            isAnalyzing={isAnalyzing}
            analysisStage={analysisStage}
            analysisResults={analysisResults}
            gapAnalysisQuestions={gapAnalysisQuestions}
            handleSendForm={handleSendForm}
            handleAnalyzeAnyway={handleAnalyzeAnyway}
            peerGroup={peerGroup} // Pass peerGroup to InsightDashboard
          />
        </div>
      </main>
    </div>
  );
};

export default InvestmentAnalystPage;