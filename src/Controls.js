import React, { useRef, useEffect } from 'react';
import './Controls.css';

const Controls = ({ weights, setWeights, userComments, setUserComments, handleAnalyze, isAnalyzing, analysisMode, setAnalysisMode }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userComments]);

  const handleWeightChange = (criterion, value) => {
    setWeights(prevWeights => ({
      ...prevWeights,
      [criterion]: parseInt(value, 10)
    }));
  };

  const totalWeight = weights.founderMarketFit + weights.problemAndMarket + weights.differentiation + weights.traction;

  const handleNormalizeWeights = () => {
    if (totalWeight === 0) {
      setWeights({
        founderMarketFit: 25,
        problemAndMarket: 25,
        differentiation: 25,
        traction: 25,
      });
      return;
    }
    const scalingFactor = 100 / totalWeight;
    setWeights({
      founderMarketFit: Math.round(weights.founderMarketFit * scalingFactor),
      problemAndMarket: Math.round(weights.problemAndMarket * scalingFactor),
      differentiation: Math.round(weights.differentiation * scalingFactor),
      traction: Math.round(weights.traction * scalingFactor),
    });
  };

  return (
    <div className="controls card">
      <h3>Controls & Investor Preferences</h3>

      <div className="weighting-section">
        <h4>Custom Weighting</h4>
        <p>Adjust the importance of each evaluation criterion.</p>
        
        <div className="slider-group">
          <label>Founder-Market Fit: {weights.founderMarketFit}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={weights.founderMarketFit} 
            onChange={(e) => handleWeightChange('founderMarketFit', e.target.value)}
          />
        </div>
        <div className="slider-group">
          <label>Problem & Market: {weights.problemAndMarket}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={weights.problemAndMarket} 
            onChange={(e) => handleWeightChange('problemAndMarket', e.target.value)}
          />
        </div>
        <div className="slider-group">
          <label>Differentiation: {weights.differentiation}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={weights.differentiation} 
            onChange={(e) => handleWeightChange('differentiation', e.target.value)}
          />
        </div>
        <div className="slider-group">
          <label>Traction: {weights.traction}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={weights.traction} 
            onChange={(e) => handleWeightChange('traction', e.target.value)}
          />
        </div>

        <p>Total Weight: <span style={{ color: totalWeight !== 100 ? 'red' : 'inherit' }}>{totalWeight}%</span></p>
        {totalWeight !== 100 && <p style={{ color: 'red', fontSize: '0.8em' }}>Total weight must be 100% to run analysis.</p>}
        <button onClick={handleNormalizeWeights} className="action-button">Normalize Weights</button>
      </div>

      <div className="guidance-section">
        <h4>Analyst Guidance</h4>
        <textarea 
          ref={textareaRef}
          placeholder="Provide specific instructions or questions to guide the AI's focus..."
          value={userComments}
          onChange={(e) => setUserComments(e.target.value)}
        ></textarea>
      </div>

      <button onClick={handleAnalyze} disabled={isAnalyzing || totalWeight !== 100} className="action-button">
        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
      </button>

      <div className="analysis-mode">
        <label>
          <input 
            type="radio" 
            value="semantic" 
            checked={analysisMode === 'semantic'} 
            onChange={() => setAnalysisMode('semantic')}
          />
          Semantic Search
        </label>
        <label>
          <input 
            type="radio" 
            value="filtered" 
            checked={analysisMode === 'filtered'} 
            onChange={() => setAnalysisMode('filtered')}
          />
          Filtered Search
        </label>
      </div>
    </div>
  );
};

export default Controls;
