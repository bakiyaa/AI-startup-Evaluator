import React from 'react';
import './Header.css';
import { useAuth } from './AuthContext';
import { FaUserCircle, FaLink, FaSyncAlt, FaSignOutAlt } from 'react-icons/fa'; // Example icons

const Header = ({ projectId, onNewProject }) => {

  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('currentProjectId');
      // You might want to redirect the user to the login page here
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

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
        <button className="icon-btn" title="Public Sources" onClick={handleLinksClick}>
          <FaLink />
        </button>
        <span className="project-id" title="Current Project ID">Project: {projectId}</span>
        <button className="icon-btn" title="New Project" onClick={onNewProject}>
          <FaSyncAlt />
        </button>
        <button className="icon-btn" title="User Profile">
          <FaUserCircle />
        </button>
        <button className="icon-btn" title="Logout" onClick={handleLogout}>
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default Header;
