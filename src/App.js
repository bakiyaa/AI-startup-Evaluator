import React, { useState } from 'react';
import './App.css';
import Header from './Header';
import Sidebar from './Sidebar';
import Benchmarking from './Benchmarking';
import DealNotes from './DealNotes';
import RiskAnalysis from './RiskAnalysis';

function App() {
  const [activeView, setActiveView] = useState('Deal Summary');

  const handleNavClick = (view) => {
    setActiveView(view);
  };

  const renderView = () => {
    switch (activeView) {
      case 'Benchmarking':
        return <Benchmarking />;
      case 'Risk Analysis':
        return <RiskAnalysis />;
      case 'Deal Summary':
      default:
        return <DealNotes />;
    }
  };

  return (
    <div className="app">
      <Header handleNavClick={handleNavClick} />
      <div className="main-container">
        <Sidebar />
        <main className="main-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
