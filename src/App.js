<<<<<<< HEAD
import React from 'react';
import './App.css';
import Header from './Header';
import Sidebar from './Sidebar';
import FileUpload from './FileUpload';
import FinancialRevenueForecast from './FinancialRevenueForecast';
import DealNotes from './DealNotes';
import RiskAnalysis from './RiskAnalysis';
=======

import React from 'react';
import './App.css';
import InvestmentAnalystPage from './InvestmentAnalystPage';
>>>>>>> 484908c (Initial commit)

function App() {
  return (
    <div className="app">
<<<<<<< HEAD
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
=======
      <InvestmentAnalystPage />
>>>>>>> 484908c (Initial commit)
    </div>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;

>>>>>>> 484908c (Initial commit)
