import React, { useState, useRef } from 'react';
import './FileUpload.css';

const FileUpload = () => {
  const [pitchDeckFile, setPitchDeckFile] = useState(null);
  const [supportingFile, setSupportingFile] = useState(null);
  const [fundingStage, setFundingStage] = useState('Seed');

  const pitchDeckInputRef = useRef(null);
  const supportingFileInputRef = useRef(null);

  const handlePitchDeckChange = (e) => {
    setPitchDeckFile(e.target.files[0]);
  };

  const handleSupportingFileChange = (e) => {
    setSupportingFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!pitchDeckFile) {
      alert('Please select a pitch deck file first!');
      return;
    }

    const filesToUpload = [pitchDeckFile];
    if (supportingFile) {
      filesToUpload.push(supportingFile);
    }

    for (const fileToUpload of filesToUpload) {
      try {
        // 1. Get signed URL from Cloud Function
        const signedUrlResponse = await fetch(`${process.env.REACT_APP_SIGNED_URL_FUNCTION_URL}?fileName=${fileToUpload.name}&contentType=${fileToUpload.type}`);
        const { url } = await signedUrlResponse.json();

        // 2. Upload file to Google Cloud Storage
        await fetch(url, {
          method: 'PUT',
          body: fileToUpload,
          headers: {
            'Content-Type': fileToUpload.type,
          },
        });

        alert(`${fileToUpload.name} uploaded successfully`);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Error uploading ${fileToUpload.name}`);
      }
    }
  };

  const triggerPitchDeckInput = () => {
    pitchDeckInputRef.current.click();
  };

  const triggerSupportingFileInput = () => {
    supportingFileInputRef.current.click();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-section">
        <h3>Pitch Deck</h3>
        <p>Upload your pitch deck in PDF or PPT format.</p>
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
        {pitchDeckFile && <p>Selected file: {pitchDeckFile.name}</p>}
      </div>

      <div className="upload-section">
        <h3>Supporting Documents</h3>
        <p>Upload call transcripts, founder updates, emails, etc.</p>
        <button className="upload-btn" onClick={triggerSupportingFileInput}>
          Upload Supporting Documents
        </button>
        <input
          type="file"
          ref={supportingFileInputRef}
          onChange={handleSupportingFileChange}
          style={{ display: 'none' }}
        />
        {supportingFile && <p>Selected file: {supportingFile.name}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="funding-stage">Funding Stage</label>
        <select id="funding-stage" value={fundingStage} onChange={(e) => setFundingStage(e.target.value)}>
          <option>Pre-Seed</option>
          <option>Seed</option>
          <option>Series A</option>
          <option>Series B</option>
        </select>
      </div>

      <button className="submit-btn" onClick={handleUpload}>
        Submit
      </button>
    </div>
  );
};

export default FileUpload;
