import React, { useState, useEffect, useMemo } from 'react';
import './InvestmentAnalystPage.css';
import Header from './Header';
import DealInformation from './DealInformation';
import Controls from './Controls';
import InsightDashboard from './InsightDashboard';
import DataRoom from './components/DataRoom.jsx';
import { useAuth } from './AuthContext'; // Import useAuth
import { db } from './firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import QueryInterface from './components/QueryInterface';

const InvestmentAnalystPage = () => {
  const { currentUser } = useAuth(); // Get the current user from your AuthContext
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
  const selectedStartupId = useMemo(() => projectId, [projectId]);

  // Data Room State
  const [dataRoomEvents, setDataRoomEvents] = useState([]);
  const [dataRequests, setDataRequests] = useState([]);

  function handleActionRequest(actions, context) {
    // Log to the Data Room
    setDataRoomEvents(prev => [
      ...prev,
      {
        id: nanoid(),
        ts: Date.now(),
        type: 'agent_actions',
        actions,
        context
      }
    ]);
    // (Optional now) immediately open any link actions
    actions.forEach(a => {
      if (a.url) window.open(a.url, '_blank', 'noopener,noreferrer');
    });
  }

  // Effect to initialize or retrieve projectId from localStorage
  useEffect(() => {
    let currentProjectId = localStorage.getItem('currentProjectId');
    if (!currentProjectId) {
      currentProjectId = uuidv4();
      localStorage.setItem('currentProjectId', currentProjectId);
    }
    setProjectId(currentProjectId);
  }, []);

  // Effect to fetch data requests from Firestore
  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, "projects", projectId, "data_requests"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setDataRequests(requests);
    });

    return () => unsubscribe();
  }, [projectId]);

  const timelineEvents = useMemo(() => {
    const combined = [
      ...dataRoomEvents,
      ...dataRequests.map(req => ({
        id: req.id,
        ts: req.timestamp?.toMillis() || Date.now(),
        type: 'data_request',
        content: req.request_text,
        status: req.status,
      })),
    ];
    return combined.sort((a, b) => b.ts - a.ts);
  }, [dataRoomEvents, dataRequests]);

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
      setDataRoomEvents([]);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0 && !userComments) {
      alert('Please upload at least one file or add some comments to start the analysis.');
      return;
    }

    if (!currentUser) {
      alert('You must be logged in to run an analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('initial');
    setAnalysisResults(null);
    setGapAnalysisQuestions([]);
    setActiveTab('insights');

    try {
      // --- This is the new, secure file upload logic ---
      const uploadFile = async (file) => {
        const generateUrlFunctionName = process.env.REACT_APP_GENERATE_URL_FUNCTION || 'generate-signed-url';
        const region = process.env.REACT_APP_GCP_REGION || 'us-central1';
        const gcpProjectId = process.env.REACT_APP_GCP_PROJECT_ID || 'digital-shadow-417907';
        const bucketName = process.env.REACT_APP_GCS_BUCKET_NAME || 'ai-starter-evaluation-bucket-9pguwa';

        const generateUrlEndpoint = `https://${region}-${gcpProjectId}.cloudfunctions.net/${generateUrlFunctionName}`;
        const filePath = `${projectId}/${file.name}`;

        const res = await fetch(generateUrlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: filePath, contentType: file.type }),
        });
        if (!res.ok) throw new Error(`Failed to get signed URL for ${file.name}`);
        const { url } = await res.json();

        const uploadRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);

        console.log(`${file.name} uploaded successfully.`);
        return `gs://${bucketName}/${filePath}`;
      };

      await Promise.all(uploadedFiles.map(uploadFile));

      // --- This is the new logic ---
      const initialQuery = `
        Analyze the startup with the following details:
        - LinkedIn URL: ${linkedinUrl}
        - Company URL: ${companyUrl}
        - User Comments: ${userComments}
        - Uploaded Files: ${uploadedFiles.map(f => f.name).join(', ')}
        - Project ID: ${projectId}
      `;

      const queryServiceUrl = process.env.REACT_APP_RAG_QUERY_SERVICE_URL || 'http://localhost:8080/query';

      const res = await axios.post(queryServiceUrl, { query: initialQuery });
      setAnalysisResults(res.data);
      setAnalysisStage('finalReport');

    } catch (error) {
      console.error("Analysis failed: ", error);
      alert(`An error occurred: ${error.message}`);
      setActiveTab('workspace');
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
      case 'askAnalyst':
        return (
            <div className="tab-panel ask-analyst" style={{ marginTop: 16 }}>
                <QueryInterface
                    selectedStartupId={selectedStartupId}
                    onActionRequest={handleActionRequest}
                />
            </div>
        );
      case 'dataroom':
        return (
            <div className="tab-panel data-room" style={{ marginTop: 16 }}>
                <DataRoom events={timelineEvents} />
            </div>
        );
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
        <button onClick={() => setActiveTab('askAnalyst')} className={activeTab === 'askAnalyst' ? 'active' : ''}>Ask Analyst</button>
        <button onClick={() => setActiveTab('dataroom')} className={activeTab === 'dataroom' ? 'active' : ''}>Data Room</button>
      </div>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default InvestmentAnalystPage;
