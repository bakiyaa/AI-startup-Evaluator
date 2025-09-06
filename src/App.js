import React from 'react';
import './App.css';
import Header from './Header';
import Sidebar from './Sidebar';
import FileUpload from './FileUpload';
import FinancialRevenueForecast from './FinancialRevenueForecast';
import DealNotes from './DealNotes';
import RiskAnalysis from './RiskAnalysis';

function App() {
  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <Sidebar />
        <main className="main-content">
          <div className="left-column">
            <h2>Evaluate Startups with AI</h2>
            <p>Generate data driven insights on potential investments</p>
            <FileUpload />
          </div>
          <div className="right-column">
            <FinancialRevenueForecast />
            <DealNotes />
            <RiskAnalysis />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;