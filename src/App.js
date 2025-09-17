
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header';
import InvestmentAnalystPage from './InvestmentAnalystPage';
import Login from './Login';
import { useAuth } from './AuthContext';
import './App.css';

function App() {
  const { currentUser } = useAuth();

  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/"
          element={currentUser ? <InvestmentAnalystPage /> : <Navigate to="/login" />}
        />
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
      </Routes>
    </div>
  );
}

export default App;

