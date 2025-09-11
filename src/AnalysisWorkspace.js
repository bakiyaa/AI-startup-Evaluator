import React, { useState } from 'react';
import './AnalysisWorkspace.css';
import DocumentViewer from './DocumentViewer';
import Controls from './Controls';
import Insights from './Insights';

const AnalysisWorkspace = () => {
  // State for controls
  const [analysisType, setAnalysisType] = useState('semantic'); // 'semantic' or 'filtered'
  const [weights, setWeights] = useState({
    team: 50,
    product: 25,
    market: 25,
  });
  const [userComments, setUserComments] = useState('');

  // State for results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    console.log('Starting analysis with the following inputs:');
    console.log('Analysis Type:', analysisType);
    console.log('Custom Weights:', weights);
    console.log('User Comments:', userComments);

    // TODO: Replace with actual API call to the backend (MCP Server)
    // const backendUrl = '...';
    try {
      // const response = await fetch(backendUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     analysisType,
      //     weights,
      //     userComments,
      //     startupId: 'CURRENT_STARTUP_ID' // This would come from props or context
      //   })
      // });
      // const results = await response.json();
      // setAnalysisResults(results);

      // Mock delay and results for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysisResults({
        summary: 'This is a mock summary based on your inputs.',
        recommendation: 'Invest (Mock)',
        benchmarks: { /* ...mock benchmark data... */ },
        risks: [{ severity: 'High', text: 'This is a mock risk.' }]
      });

    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisResults({ error: 'Analysis failed. Please try again.' });
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="analysis-workspace">
      <div className="left-panel">
        <DocumentViewer />
      </div>
      <div className="right-panel">
        <Controls
          analysisType={analysisType}
          setAnalysisType={setAnalysisType}
          weights={weights}
          setWeights={setWeights}
          userComments={userComments}
          setUserComments={setUserComments}
          handleAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
        <Insights
          isAnalyzing={isAnalyzing}
          results={analysisResults}
        />
      </div>
    </div>
  );
};

export default AnalysisWorkspace;
