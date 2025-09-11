import React, { useState } from 'react';
import './App.css';
import Header from './Header';
import Sidebar from './Sidebar';
import DocumentViewer from './DocumentViewer';
import InteractiveAnalysis from './InteractiveAnalysis';
import Benchmarking from './Benchmarking';
import PastAnalyses from './PastAnalyses';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Header toggleSidebar={toggleSidebar} />
      <div className="main-container">
        {sidebarOpen && <Sidebar />}
        <main className="main-content">
          <div className="column">
            <InteractiveAnalysis />
          </div>
          <div className="column">
            <DocumentViewer />
            <PastAnalyses />
            <Benchmarking />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
