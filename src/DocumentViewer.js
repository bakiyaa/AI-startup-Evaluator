import React from 'react';
import './DocumentViewer.css';

const DocumentViewer = () => {
  return (
    <div className="document-viewer-panel">
      <h3>Materials</h3>

      <div className="card">
        <h4>Preview</h4>
        <div className="pitch-deck-viewer-placeholder">
            <h5>Pitch Deck Viewer</h5>
            {/* This would be replaced by a real PDF viewer component */}
            <p>[Pitch Deck content would be displayed here]</p>
        </div>
      </div>

      <div className="card">
        <h4>Processed Notes</h4>
        <p>Processed notes and transcript snippets will appear here.</p>
      </div>
    </div>
  );
};

export default DocumentViewer;
