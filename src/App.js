import React from 'react';
import './App.css';
import Header from './Header';
import Sidebar from './Sidebar';
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
          <FinancialRevenueForecast />
          <DealNotes />
          <RiskAnalysis />
        </main>
      </div>
    </div>
  );
}

export default App;