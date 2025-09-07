import React from 'react';
import './Header.css';

const Header = ({ handleNavClick }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn">&#9776;</button>
        <div className="logo">AI Analyst</div>
      </div>
      <nav className="header-nav">
        <a href="/" className="nav-item" onClick={(e) => { e.preventDefault(); handleNavClick('Deal Summary'); }}>Deal Summary</a>
        <a href="/" className="nav-item" onClick={(e) => { e.preventDefault(); handleNavClick('Benchmarking'); }}>Benchmarking</a>
        <a href="/" className="nav-item" onClick={(e) => { e.preventDefault(); handleNavClick('Risk Analysis'); }}>Risk Analysis</a>
      </nav>
      <div className="header-right">
        <button className="icon-btn">&#128276;</button>
        <button className="icon-btn">&#128100;</button>
      </div>
    </header>
  );
};

export default Header;
