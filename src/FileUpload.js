import React, { useState, useRef } from 'react';
import './FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [supportingFile, setSupportingFile] = useState(null);
  const fileInputRef = useRef(null);
  const supportingFileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSupportingFileChange = (e) => {
    setSupportingFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a pitch deck file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (supportingFile) {
      formData.append('supportingFile', supportingFile);
    }

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Files uploaded successfully');
      } else {
        alert('Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const triggerSupportingFileInput = () => {
    supportingFileInputRef.current.click();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <button className="upload-btn" onClick={triggerFileInput}>Upload Pitch Deck</button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
      </div>
      {file && <p>Selected file: {file.name}</p>}
      <div className="checkbox-group">
        <label>
          <input type="checkbox" checked readOnly /> Pre-Revenue
        </label>
        <label>
          <input type="checkbox" checked readOnly /> Post-Revenue
        </label>
      </div>
      <div className="form-group">
        <label htmlFor="domain">Domain/Industry</label>
        <input type="text" id="domain" value="Telecom,Automobile" readOnly />
      </div>
      <div className="form-group">
        <label htmlFor="supporting-docs">Supporting Documents</label>
        <div className="upload-group">
          <input type="text" id="supporting-docs" placeholder="Supporting Documents-optional" value={supportingFile ? supportingFile.name : ''} readOnly />
          <button className="upload-btn-secondary" onClick={triggerSupportingFileInput}>+ upload</button>
          <input type="file" ref={supportingFileInputRef} onChange={handleSupportingFileChange} style={{ display: 'none' }} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="post-revenue">Post-Revenue</label>
        <select id="post-revenue">
          <option>Seed Series</option>
          <option>Revenue-Based Financing</option>
          <option>Bridge Round</option>
          <option>Pre-Series A</option>
          <option>Traditional Seed Round</option>
        </select>
      </div>
      <button className="submit-btn" onClick={handleUpload}>Submit</button>
    </div>
  );
};

export default FileUpload;
