import React from 'react';
import './Controls.css';

const Controls = ({
  analysisType,
  setAnalysisType,
  weights,
  userComments,
  setUserComments,
  publicNews,
  setPublicNews,
  handleAnalyze,
  isAnalyzing
}) => {

  return (
    <div className="controls-panel card">
      <h3>Analysis Mode</h3>

      <fieldset className="control-group">
        <div>
            <button
              className={`toggle-button ${analysisType === 'semantic' ? 'active' : ''}`}
              onClick={() => setAnalysisType('semantic')}
            >
              Semantic
            </button>
            <button
              className={`toggle-button ${analysisType === 'filtered' ? 'active' : ''}`}
              onClick={() => setAnalysisType('filtered')}
            >
              Filtered
            </button>
        </div>
      </fieldset>

      <fieldset className="control-group">
        <legend>Weight Distribution</legend>
        <div className="weight-display">
            <span>Team: {weights.team}%</span>
            <span>Product: {weights.product}%</span>
            <span>Market: {weights.market}%</span>
        </div>
      </fieldset>

      <fieldset className="control-group">
        <legend>Options</legend>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={publicNews}
            onChange={(e) => setPublicNews(e.target.checked)}
          />
          Public News
        </label>
      </fieldset>

      <p className="helper-text tip">Tip: Use filtered mode for strict KPI thresholds.</p>

      <fieldset className="control-group">
        <legend htmlFor="userComments">Analyst Guidance</legend>
        <textarea
          id="userComments"
          value={userComments}
          onChange={(e) => setUserComments(e.target.value)}
          placeholder="e.g., 'Focus on the team\'s experience...'"
        />
      </fieldset>

      <div className="report-actions">
        <button onClick={handleAnalyze} className="action-button primary-action" disabled={isAnalyzing}>
          {isAnalyzing ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>

    </div>
  );
};

export default Controls;
