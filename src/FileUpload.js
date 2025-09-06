import React, { useState } from 'react';
import './FileUpload.css';
import { storage, db } from './firebase';

const FileUpload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      const uploadTask = storage.ref(`uploads/${file.name}`).put(file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {},
        (error) => {
          console.log(error);
        },
        () => {
          storage
            .ref('uploads')
            .child(file.name)
            .getDownloadURL()
            .then((url) => {
              console.log("File available at", url);
              // Add a document to Firestore to test the connection
              db.collection('uploads').add({
                url: url,
                createdAt: new Date(),
              })
              .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
              })
              .catch((error) => {
                console.error("Error adding document: ", error);
              });
            });
        }
      );
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Evaluate Startups with AI</h2>
      <p>Generate data driven insights on potential investments</p>
      <div className="upload-section">
        <button className="upload-btn">Upload Pitch Deck</button>
      </div>
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
          <input type="text" id="supporting-docs" placeholder="Supporting Documents-optional" />
          <button className="upload-btn-secondary" onClick={handleUpload}>+ upload</button>
        </div>
        <input type="file" onChange={handleFileChange} style={{display: 'none'}} />
      </div>
      <div className="form-group">
        <label htmlFor="post-revenue">Post-Revenue</label>
        <select id="post-revenue">
          <option>Seed Series</option>
        </select>
      </div>
      <button className="submit-btn">Submit</button>
    </div>
  );
};

export default FileUpload;
