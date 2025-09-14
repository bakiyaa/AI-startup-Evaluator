import React from 'react';
import './Header.css';

const Header = () => {
<<<<<<< HEAD
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn">&#9776;</button>
        <div className="logo">SparkCode</div>
      </div>
      <nav className="header-nav">
        <a href="#" className="nav-item">Deal Summary</a>
        <a href="#" className="nav-item">Bench Marking</a>
        <a href="#" className="nav-item">Risk Analysis</a>
        <a href="#" className="nav-item">Views</a>
      </nav>
      <div className="header-right">
        <button className="icon-btn">&#128276;</button>
        <button className="icon-btn">&#128100;</button>
=======

  const handleLinksClick = () => {
    alert('This will show a list of public sources found by the AI.');
  };

  return (
    <header className="header">
      <div className="header-title">
        <h1>AI Investment Analyst</h1>
        <p>Synthesize data to generate investment insights</p>
      </div>
      <div className="header-actions">
        <button className="icon-btn" onClick={handleLinksClick}>🔗</button>
        <button className="icon-btn">👤</button>
>>>>>>> 484908c (Initial commit)
      </div>
    </header>
  );
};

export default Header;
