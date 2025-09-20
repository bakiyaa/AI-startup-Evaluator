import React, { useState, useRef, useEffect } from 'react';
import './DealInformation.css';

const DealInformation = ({
  handleFindPeerGroup,
  filters,
  handleFilterChange,
  onFilesChange,
  linkedinUrl,
  onLinkedinUrlChange,
  companyUrl,
  onCompanyUrlChange
}) => {
  const [pitchDeckFile, setPitchDeckFile] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const pitchDeckInputRef = useRef(null);
  const supportingDocsInputRef = useRef(null);

  useEffect(() => {
    const allFiles = [];
    if (pitchDeckFile) allFiles.push(pitchDeckFile);
    allFiles.push(...supportingDocs);
    onFilesChange(allFiles); // Pass the full File objects up
  }, [pitchDeckFile, supportingDocs, onFilesChange]);

  const handlePitchDeckChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPitchDeckFile(file);
    }
  };

  const handleSupportingDocsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSupportingDocs(prevFiles => [...prevFiles, ...files]);
    }
  };

  const handlePitchDeckClick = () => {
    pitchDeckInputRef.current.click();
  };

  const handleSupportingDocsClick = () => {
    supportingDocsInputRef.current.click();
  };

  return (
    <div className="deal-information card">
      <h3>Deal Information</h3>
      
      <div className="upload-section">
        <h4>Upload Pitch Deck</h4>
        <input 
          type="file" 
          ref={pitchDeckInputRef} 
          onChange={handlePitchDeckChange} 
          style={{ display: 'none' }} 
        />
        <button onClick={handlePitchDeckClick} className="upload-button">
          <span className="icon">📄</span> Upload Pitch Deck
        </button>
        {pitchDeckFile && <div className="file-item">{pitchDeckFile.name}</div>}
      </div>

      <div className="upload-section">
        <h4>Supporting Documents (Optional)</h4>
        <input 
          type="file" 
          multiple 
          ref={supportingDocsInputRef} 
          onChange={handleSupportingDocsChange} 
          style={{ display: 'none' }} 
        />
        <button onClick={handleSupportingDocsClick} className="upload-button">
          <span className="icon">+</span> Upload Additional Files
        </button>
        <div className="file-list">
          {supportingDocs.map((file, index) => (
            <div key={index} className="file-item">{file.name}</div>
          ))}
        </div>
      </div>

      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="revenue"
            value="pre"
            checked={filters.revenue === 'pre'}
            onChange={handleFilterChange}
          /> Pre-Revenue
        </label>
        <label>
          <input
            type="radio"
            name="revenue"
            value="post"
            checked={filters.revenue === 'post'}
            onChange={handleFilterChange}
          /> Post-Revenue
        </label>
      </div>

      <select
        className="text-input" 
        name="stage" 
        value={filters.stage || ''} 
        onChange={handleFilterChange}
      >
        <option value="">Select Stage</option>
        <option value="pre-seed">Pre-Seed</option>
        <option value="seed">Seed</option>
        <option value="series-a">Series A</option>
        <option value="series-b">Series B</option>
        <option value="series-c">Series C</option>
        <option value="growth">Growth Stage</option>
        <option value="late">Late Stage</option>
        <option value="ipo">IPO</option>
        <option value="acquisition">Acquisition</option>
      </select>
   
      <input 
        type="text" 
        className="text-input" 
        name="domain"
        placeholder="Domain / Industry (e.g., Fintech, SaaS)"
        value={filters.domain || ''}
        onChange={handleFilterChange}
      />

      <div className="public-url-inputs">
        <h4>Public URLs</h4>
        <input
          type="text"
          className="text-input"
          placeholder="LinkedIn Profile URL"
          value={linkedinUrl}
          onChange={(e) => onLinkedinUrlChange(e.target.value)}
        />
        <input
          type="text"
          className="text-input"
          placeholder="Company Website URL"
          value={companyUrl}
          onChange={(e) => onCompanyUrlChange(e.target.value)}
        />
      </div>
      
    </div>
  );
};

export default DealInformation;
