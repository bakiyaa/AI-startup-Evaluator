import React, { useState, useRef } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [preRevenue, setPreRevenue] = useState(true);
  const [postRevenue, setPostRevenue] = useState(true);
  const [pitchDeckFile, setPitchDeckFile] = useState(null);
  const [supportingFile, setSupportingFile] = useState(null);
  const [fundingStage, setFundingStage] = useState('Seed Series');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Progress is simplified now
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

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
    if (!pitchDeckFile) {
      setError('Please select a pitch deck to upload.');
      return;
    }

    const uploadFile = async (file) => {
      setUploading(true);
      setUploadSuccess(false);
      setError('');
      setUploadProgress(50); // Indicate progress has started

      try {
        // 1. Get a signed URL from our new function
        const generateUrlFunctionName = 'generate-signed-url'; // Should be an env var
        const region = 'us-central1'; // Should be an env var
        const projectId = 'digital-shadow-417907'; // Should be an env var
        const generateUrlEndpoint = `https://${region}-${projectId}.cloudfunctions.net/${generateUrlFunctionName}`;

        const res = await fetch(generateUrlEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to get signed URL: ${await res.text()}`);
        }

        const { url } = await res.json();

        // 2. Upload the file directly to the bucket using the signed URL
        const uploadRes = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type
            ': file.type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${await uploadRes.text()}`);
        }

        setUploadProgress(100);
        setUploading(false);
        setUploadSuccess(true);
        console.log('File uploaded successfully!');

        // Reset file inputs after successful upload
        setPitchDeckFile(null);
        setSupportingFile(null);

      } catch (error) {
        setError(`Upload failed: ${error.message}`);
        setUploading(false);
        setUploadProgress(0);
      }
    };

    if (pitchDeckFile) {
      uploadFile(pitchDeckFile);
    }
    if (supportingFile) {
      uploadFile(supportingFile);
    }
  };

  return (
    <aside className="sidebar">
      <h2>Deal Information</h2>
      <p className="subtitle">Synthesize data to generate investment insights</p>

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

      <button className="submit-btn" onClick={handleSubmit} disabled={uploading}>
        {uploading ? `Uploading...` : 'Submit'}
      </button>

      {uploadSuccess && <p className="success-message">Upload successful!</p>}
      {error && <p className="error-message">{error}</p>}
    </aside>
  );
};

export default Sidebar;
