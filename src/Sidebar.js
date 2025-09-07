import React, { useState, useRef } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [preRevenue, setPreRevenue] = useState(true);
  const [postRevenue, setPostRevenue] = useState(true);
  const [pitchDeckFile, setPitchDeckFile] = useState(null);
  const [supportingFile, setSupportingFile] = useState(null);
  const [fundingStage, setFundingStage] = useState('Seed Series');

  const pitchDeckInputRef = useRef(null);
  const supportingFileInputRef = useRef(null);

  const handlePitchDeckChange = (e) => {
    setPitchDeckFile(e.target.files[0]);
  };

  const handleSupportingFileChange = (e) => {
    setSupportingFile(e.target.files[0]);
  };

  const triggerPitchDeckInput = () => {
    pitchDeckInputRef.current.click();
  };

  const triggerSupportingFileInput = () => {
    supportingFileInputRef.current.click();
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log({
      preRevenue,
      postRevenue,
      pitchDeckFile,
      supportingFile,
      fundingStage,
    });
  };

  return (
    <aside className="sidebar">
      <h2>Evaluate Startups with AI</h2>
      <p className="subtitle">Generate data driven insights on potential investments</p>

      <button className="upload-btn" onClick={triggerPitchDeckInput}>
        Upload Pitch Deck
      </button>
      <input
        type="file"
        ref={pitchDeckInputRef}
        onChange={handlePitchDeckChange}
        style={{ display: 'none' }}
        accept=".pdf,.ppt,.pptx"
      />
      {pitchDeckFile && <p className="file-name">Selected file: {pitchDeckFile.name}</p>}

      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={preRevenue}
            onChange={() => setPreRevenue(!preRevenue)}
          />
          Pre-Revenue
        </label>
        <label>
          <input
            type="checkbox"
            checked={postRevenue}
            onChange={() => setPostRevenue(!postRevenue)}
          />
          Post-Revenue
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="domain">Domain/Industry</label>
        <input type="text" id="domain" placeholder="Telecom,Automobile" />
      </div>

      <div className="form-group">
        <label>Supporting Documents</label>
        <div className="supporting-docs">
          <span>Supporting Documents-optional</span>
          <button className="upload-btn-small" onClick={triggerSupportingFileInput}>+ upload</button>
        </div>
        <input
          type="file"
          ref={supportingFileInputRef}
          onChange={handleSupportingFileChange}
          style={{ display: 'none' }}
        />
        {supportingFile && <p className="file-name">Selected file: {supportingFile.name}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="funding-stage">Post-Revenue</label>
        <select id="funding-stage" value={fundingStage} onChange={(e) => setFundingStage(e.target.value)}>
          <option>Seed Series</option>
          <option>Pre-Seed</option>
          <option>Series A</option>
          <option>Series B</option>
        </select>
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        Submit
      </button>
    </aside>
  );
};

export default Sidebar;