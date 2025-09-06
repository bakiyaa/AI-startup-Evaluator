import React from 'react';
import './Header.css';

const Header = () => {
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
      </div>
    </header>
  );
};

export default Header;
