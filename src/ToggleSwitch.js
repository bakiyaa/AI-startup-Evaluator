import React from 'react';
import './ToggleSwitch.css';

const ToggleSwitch = ({ label, isToggled, handleToggle }) => {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch">
        <input type="checkbox" checked={isToggled} onChange={handleToggle} />
        <span className="switch" />
      </label>
      <span className="toggle-label">{label}</span>
    </div>
  );
};

export default ToggleSwitch;
