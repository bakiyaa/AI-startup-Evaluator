import React, { useState, useEffect } from 'react';
import './InvestmentAnalystPage.css';
import Header from './Header';
import DealInformation from './DealInformation';
import Controls from './Controls';
import InsightDashboard from './InsightDashboard';
import DataRoom from './DocumentViewer';
import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const InvestmentAnalystPage = () => {
  const [activeTab, setActiveTab] = useState('workspace');

  // State lifted from children components
  const [weights, setWeights] = useState({ founderMarketFit: 30, problemAndMarket: 25, differentiation: 20, traction: 25 });
  const [userComments, setUserComments] = useState('');
  const [analysisMode, setAnalysisMode] = useState('filtered');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('initial');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [gapAnalysisQuestions, setGapAnalysisQuestions] = useState([]);

  // Deal Information State
  const [filters, setFilters] = useState({ stage: 'seed', revenue: 'post', domain: '' });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');

  // Project ID State
  const [projectId, setProjectId] = useState('');

  // Effect to initialize or retrieve projectId from localStorage
  useEffect(() => {
    let currentProjectId = localStorage.getItem('currentProjectId');
    if (!currentProjectId) {
      currentProjectId = uuidv4();
      localStorage.setItem('currentProjectId', currentProjectId);
    }
    setProjectId(currentProjectId);
  }, []);

  const handleNewProject = () => {
    if (window.confirm('Are you sure you want to start a new project? This will clear your current inputs.')) {
      const newProjectId = uuidv4();
      localStorage.setItem('currentProjectId', newProjectId);
      setProjectId(newProjectId);

      // Reset all other states to their initial values
      setActiveTab('workspace');
      setWeights({ founderMarketFit: 30, problemAndMarket: 25, differentiation: 20, traction: 25 });
      setUserComments('');
      setAnalysisMode('filtered');
      setIsAnalyzing(false);
      setAnalysisStage('initial');
      setAnalysisResults(null);
      setGapAnalysisQuestions([]);
      setFilters({ stage: 'seed', revenue: 'post', domain: '' });
      setUploadedFiles([]);
      setLinkedinUrl('');
      setCompanyUrl('');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = async () => {
    // Only trigger upload for files that haven't been uploaded yet for this project.
    // For this example, we'll re-upload each time, but in a real app you'd track this.
    if (uploadedFiles.length === 0 && !userComments) {
      alert('Please upload at least one file or add some comments to start the analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('initial');
    setAnalysisResults(null);
    setGapAnalysisQuestions([]);
    setActiveTab('insights'); // Switch to insights tab to show progress

    try {
      // --- This is the new, secure file upload logic ---

      // Helper function to upload a single file
      const uploadFile = async (file) => {
        // These should ideally be in an environment configuration file
        const generateUrlFunctionName = process.env.REACT_APP_GENERATE_URL_FUNCTION || 'generate-signed-url';
        const region = process.env.REACT_APP_GCP_REGION || 'us-central1';
        const gcpProjectId = process.env.REACT_APP_GCP_PROJECT_ID || 'digital-shadow-417907';
        const bucketName = process.env.REACT_APP_GCS_BUCKET_NAME || 'ai-starter-evaluation-bucket-9pguwa';

        const generateUrlEndpoint = `https://${region}-${gcpProjectId}.cloudfunctions.net/${generateUrlFunctionName}`;
        const filePath = `${projectId}/${file.name}`; // Use the persistent projectId for the folder

        // 1. Get signed URL
        const res = await fetch(generateUrlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Send the full path to the function so it can generate the correct URL
          body: JSON.stringify({ fileName: filePath, contentType: file.type }),
        });
        if (!res.ok) throw new Error(`Failed to get signed URL for ${file.name}`);
        const { url } = await res.json();

        // 2. Upload file directly to GCS
        const uploadRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);

        console.log(`${file.name} uploaded successfully.`);
        return `gs://${bucketName}/${filePath}`; // Return the full GCS path
      };

      // Upload all files in parallel
      const uploadedFilePaths = await Promise.all(uploadedFiles.map(uploadFile));

      // --- Submit analysis job to Firestore ---
      const dealData = {
        projectId, // Include the project ID in the deal data
        weights,
        userComments, // This is UI data, not a file. It should be pushed to Firestore.
        filters,
        analysisMode,
        linkedinUrl,
        companyUrl,
        uploadedFilePaths,
        createdAt: serverTimestamp(),
        status: 'processing', // Initial status
      };

      const docRef = await addDoc(collection(db, "deals"), dealData);
      console.log("Deal document written with ID: ", docRef.id);

      setAnalysisStage('formSent');

    } catch (error) {
      console.error("Analysis submission failed: ", error);
      console.error("Error name: ", error.name);
      console.error("Error message: ", error.message);
      console.error("Error stack: ", error.stack);
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
              handleFilterChange={handleFilterChange}
              filters={filters}
              onFilesChange={setUploadedFiles}
              linkedinUrl={linkedinUrl}
              onLinkedinUrlChange={setLinkedinUrl}
              companyUrl={companyUrl}
              onCompanyUrlChange={setCompanyUrl}
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
      <Header projectId={projectId} onNewProject={handleNewProject} />
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
