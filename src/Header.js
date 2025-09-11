import React from 'react';
import './Header.css';

const Header = ({ toggleSidebar }) => {

  const handleLinksClick = (e) => {
    e.preventDefault();
    // TODO: Implement logic to show a modal or panel with relevant links.
    console.log("Links button clicked");
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>&#9776;</button>
        <div className="logo">AI Investment Analyst</div>
      </div>
      <nav className="header-nav">
        {/* Main navigation items removed for single-page view */}
      </nav>
      <div className="header-right">
        <button title="Links" className="icon-btn" onClick={handleLinksClick}>&#128279;</button>
        <button title="Notifications" className="icon-btn">&#128276;</button>
        <button title="Profile" className="icon-btn">&#128100;</button>
      </div>
    </header>
  );
};

export default Header;