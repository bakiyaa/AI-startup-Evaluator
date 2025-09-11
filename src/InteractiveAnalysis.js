import React, { useState } from 'react';
import Controls from './Controls';
import Insights from './Insights';

const InteractiveAnalysis = () => {
  // State for controls
  const [analysisType, setAnalysisType] = useState('semantic'); // 'semantic' or 'filtered'
  const [weights] = useState({
    team: 50,
    product: 25,
    market: 25,
  });
  const [userComments, setUserComments] = useState('');
  const [publicNews, setPublicNews] = useState(false);

  // State for results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    console.log('Starting analysis with the following inputs:');
    console.log('Analysis Type:', analysisType);
    console.log('Custom Weights:', weights);
    console.log('User Comments:', userComments);
    console.log('Include Public News:', publicNews);

    // TODO: Replace with actual API call to the backend (MCP Server)
    try {
      // Mock delay and results for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysisResults({
        summary: `This is a mock summary based on your inputs: ${userComments}`,
        recommendation: 'Invest (Mock)',
        benchmarks: { /* ...mock benchmark data... */ },
        risks: [{ severity: 'High', text: 'This is a mock risk based on your inputs.' }]
      });

    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisResults({ error: 'Analysis failed. Please try again.' });
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="interactive-analysis">
      <h2>Interactive Analysis Sandbox</h2>
      
      <Controls
        analysisType={analysisType}
        setAnalysisType={setAnalysisType}
        weights={weights}
        userComments={userComments}
        setUserComments={setUserComments}
        publicNews={publicNews}
        setPublicNews={setPublicNews}
        handleAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      <Insights
        isAnalyzing={isAnalyzing}
        results={analysisResults}
      />
    </div>
  );
};

export default InteractiveAnalysis;
