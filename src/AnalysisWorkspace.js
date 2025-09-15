import React from 'react';
import './AnalysisWorkspace.css';
import DataRoom from './DocumentViewer';
import InsightsWorkspace from './Insights';

const AnalysisWorkspace = () => {
  return (
    <div className="analysis-workspace">
      <div className="left-panel">
        <DataRoom />
      </div>
      <div className="right-panel">
        <InsightsWorkspace />
      </div>
    </div>
  );
};

export default AnalysisWorkspace;

