import React from 'react';
import './Header.css';

const Header = () => {

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
      </div>
    </header>
  );
};

export default Header;
