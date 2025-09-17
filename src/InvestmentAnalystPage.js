import React, { useState } from 'react';
import './InvestmentAnalystPage.css';
import Header from './Header';
import DealInformation from './DealInformation';
import Controls from './Controls';
import InsightDashboard from './InsightDashboard';
import DataRoom from './DocumentViewer';
import { db } from './firebaseConfig'; // Import firestore instance
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  const [uploadedFiles, setUploadedFiles] = useState([]); // Changed from names to full File objects

  const [analysisMode, setAnalysisMode] = useState('filtered');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please select at least one document to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('initial');
    setAnalysisResults(null);
    setGapAnalysisQuestions([]);
    setActiveTab('insights');

    try {
      // Helper function to upload a single file
      const uploadFile = async (file) => {
        const generateUrlFunctionName = 'generate-signed-url';
        const region = 'us-central1';
        const projectId = 'digital-shadow-417907';
        const generateUrlEndpoint = `https://${region}-${projectId}.cloudfunctions.net/${generateUrlFunctionName}`;

        // 1. Get signed URL
        const res = await fetch(generateUrlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });
        if (!res.ok) throw new Error(`Failed to get signed URL for ${file.name}`);
        const { url } = await res.json();

        // 2. Upload file
        const uploadRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);
        
        console.log(`${file.name} uploaded successfully.`);
        return `gs://ai-starter-evaluation-bucket-9pguwa/${file.name}`; // Return GCS path
      };

      // Upload all files in parallel
      const uploadedFilePaths = await Promise.all(uploadedFiles.map(uploadFile));

      // 3. Submit UI data and file paths to Firestore
      const dealData = {
        weights,
        userComments,
        domain,
        filters,
        analysisMode,
        uploadedFilePaths, // Array of GCS paths
        createdAt: serverTimestamp(),
        status: 'processing', // Initial status
      };

      const docRef = await addDoc(collection(db, "deals"), dealData);
      console.log("Deal document written with ID: ", docRef.id);

      // For now, we just show a success message. The backend is processing.
      // In a real app, you would poll for results or listen for a websocket event.
      setAnalysisStage('formSent'); // Using 'formSent' stage to indicate processing has started

    } catch (error) {
      console.error("Analysis submission failed: ", error);
      alert(`An error occurred: ${error.message}`);
      setActiveTab('workspace'); // Go back to workspace on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  // These are mock functions and can be removed or replaced with real logic
  const handleSendForm = () => {};
  const handleAnalyzeAnyway = () => {};

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
              onFilesChange={setUploadedFiles} // Changed from setUploadedFileNames
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
