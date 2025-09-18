const { GeminiClient } = require('./gemini-client');

async function getSuggestions(data) {
  const { startupName, identifiedGaps, processedDocumentData, publicData } = data;

  const prompt = `
  You are an AI assistant tasked with generating precise and actionable questions to fill information gaps for an investment analysis.

  Startup Name: ${startupName}
  Identified Gaps: ${identifiedGaps.join(', ')}
  Processed Document Data: ${processedDocumentData ? JSON.stringify(processedDocumentData) : 'None'}
  Public Data: ${publicData || 'None'}

  Based on the above, generate a list of 3-5 concise, framing questions that an analyst can ask to gather the missing information. Provide only the questions, one per line.
  `;

  const gemini = new GeminiClient();
  const suggestionsRaw = await gemini.generate(prompt);
  const suggestions = suggestionsRaw.split('\n').filter(q => q.trim() !== '');

  return suggestions;
}

module.exports = { getSuggestions };
