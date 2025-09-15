const { VertexAI } = require('@google-cloud/vertexai');

class GeminiClient {
  constructor() {
    const project = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_REGION || 'us-central1';

    this.vertexAI = new VertexAI({ project, location });
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
  }

  async generate(prompt) {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
        return response.candidates[0].content.parts[0].text;
      } else {
        // Handle cases where the response is not in the expected format
        console.error('Unexpected Gemini API response format:', response);
        throw new Error('Failed to parse content from Gemini');
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate content from Gemini');
    }
  }
}

module.exports = { GeminiClient };