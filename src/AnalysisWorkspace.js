import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalysisWorkspace.css';
import DealInformation from './DealInformation';
import Controls from './Controls';

const AnalysisWorkspace = () => {
  const navigate = useNavigate();

  // State for Controls component
  const [weights, setWeights] = React.useState({
    founderMarketFit: 30,
    problemAndMarket: 25,
    differentiation: 20,
    traction: 25,
  });
  const [userComments, setUserComments] = React.useState('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisMode, setAnalysisMode] = React.useState('filtered');

  // State for DealInformation component
  const [filters, setFilters] = React.useState({ stage: 'seed' }); // Provide initial state
  const [domain, setDomain] = React.useState('');
  const [uploadedFileNames, setUploadedFileNames] = React.useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = () => {
    console.log('Shared "Run Analysis" button clicked.');
    setIsAnalyzing(true);
    // Simulate analysis and then navigate
    setTimeout(() => {
      setIsAnalyzing(false);
      navigate('/insights'); // Navigate to the insights page
    }, 2000);
  };

  return (
    <div className="analysis-workspace">
      <div className="left-panel">
        <DealInformation 
          filters={filters}
          handleFilterChange={handleFilterChange}
          onDomainChange={setDomain}
          onFilesChange={setUploadedFileNames}
          // handleFindPeerGroup is not used in the new structure, so we can pass a dummy function
          handleFindPeerGroup={() => console.log('Find Peer Group clicked')}
        />
      </div>
      <div className="right-panel">
        <div className="controls-container">
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
      </div>
    </div>
  );
};

export default AnalysisWorkspace;

