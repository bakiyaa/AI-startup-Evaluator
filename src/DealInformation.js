import React, { useState, useRef, useEffect } from 'react';
import './DealInformation.css';
import { storage } from './firebaseConfig'; // Import Firebase storage
import { ref, uploadBytes } from 'firebase/storage';

const DealInformation = ({ handleFindPeerGroup, filters, handleFilterChange, onDomainChange, onFilesChange }) => {
  const [pitchDeckFile, setPitchDeckFile] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [domain, setDomain] = useState('');
  const pitchDeckInputRef = useRef(null);
  const supportingDocsInputRef = useRef(null);

  useEffect(() => {
    const allFiles = [];
    if (pitchDeckFile) allFiles.push(pitchDeckFile);
    allFiles.push(...supportingDocs);
    if (onFilesChange) {
      onFilesChange(allFiles.map(f => f.name));
    }
  }, [pitchDeckFile, supportingDocs, onFilesChange]);

  const handlePitchDeckChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPitchDeckFile(file);
      handleUpload([file]);
    }
  };

  const handleSupportingDocsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSupportingDocs(prevFiles => [...prevFiles, ...files]);
      handleUpload(files);
    }
  };

  const handlePitchDeckClick = () => {
    pitchDeckInputRef.current.click();
  };

  const handleSupportingDocsClick = () => {
    supportingDocsInputRef.current.click();
  };

  const handleUpload = async (filesToUpload) => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    for (const file of filesToUpload) {
      const storageRef = ref(storage, `uploads/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        console.log(`Successfully uploaded ${file.name}`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
    setIsUploading(false);
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
        <label><input type="radio" name="revenue" value="pre" /> Pre-Revenue</label>
        <label><input type="radio" name="revenue" value="post" defaultChecked /> Post-Revenue</label>
      </div>
      <div className="radio-group">
        <label><input type="radio" name="stage" value="seed" /> Seed</label>
        <label><input type="radio" name="stage" value="series-a" /> Series A</label>
      </div>
      
      <select 
        className="text-input" 
        value={domain} 
        onChange={(e) => { setDomain(e.target.value); onDomainChange(e.target.value); }}
      >
        <option value="">Select Domain / Industry</option>
        <option value="Fintech">Fintech</option>
        <option value="Healthtech">Healthtech</option>
        <option value="Edtech">Edtech</option>
        <option value="SaaS">SaaS</option>
        <option value="E-commerce">E-commerce</option>
      </select>
      
      <h4>Search Filters (for Vertex AI)</h4>
      <div className="filter-group">
        <label htmlFor="keywords">Keywords</label>
        <input type="text" id="keywords" name="keywords" value={filters.keywords} onChange={handleFilterChange} placeholder="e.g., 'B2B SaaS', 'Fintech'" />
      </div>
      <div className="filter-group">
        <label htmlFor="startDate">Start Date</label>
        <input type="date" id="startDate" name="startDate" value={filters.startDate || ''} onChange={handleFilterChange} />
      </div>
      <div className="filter-group">
        <label htmlFor="endDate">End Date</label>
        <input type="date" id="endDate" name="endDate" value={filters.endDate || ''} onChange={handleFilterChange} />
      </div>
      <button onClick={handleFindPeerGroup} className="action-button">Find Peer Group</button>

    </div>
  );
};

export default DealInformation;
