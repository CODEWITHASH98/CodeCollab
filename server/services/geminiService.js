/**
 * Google Gemini AI Service
 * 
 * Free tier integration for:
 * - Code review
 * - Code explanation
 * - Hint generation
 * 
 * Free tier: 1M tokens/month (very generous!)
 * Docs: https://ai.google.dev/
 */

import { logger } from '../utils/logger.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-1.5-flash'; // Available on free tier

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || null;
        this.enabled = !!this.apiKey;

        if (this.enabled) {
            logger.success('Google Gemini AI service enabled');
        } else {
            logger.warning('Gemini API key not configured. Add GEMINI_API_KEY to .env');
        }
    }

    /**
     * Generate a helpful hint for the code
     */
    async generateHint(code, language = 'javascript') {
        if (!this.enabled) {
            return { success: false, error: 'Gemini not configured' };
        }

        try {
            const prompt = `You are a helpful coding tutor. Given this ${language} code, provide ONE helpful hint to guide the programmer. Don't give the solution directly.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a brief, encouraging hint (1-2 sentences):`;

            const response = await this.query(prompt);

            return {
                success: true,
                hint: response,
                source: 'gemini',
            };
        } catch (error) {
            logger.error('Gemini hint error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Review code for issues and improvements
     */
    async reviewCode(code, language = 'javascript') {
        if (!this.enabled) {
            return { success: false, error: 'Gemini not configured' };
        }

        try {
            const prompt = `Review this ${language} code. Respond in JSON format only:

\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON (no markdown):
{
  "score": <number 1-10>,
  "summary": "<brief summary>",
  "issues": ["<issue1>", "<issue2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>"],
  "complexity": {"time": "<O notation>", "space": "<O notation>"}
}`;

            const response = await this.query(prompt);

            // Try to parse JSON from response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const review = JSON.parse(jsonMatch[0]);
                    return {
                        success: true,
                        ...review,
                        source: 'gemini',
                    };
                }
            } catch {
                // If JSON parsing fails, return as text
            }

            return {
                success: true,
                summary: response,
                source: 'gemini',
            };
        } catch (error) {
            logger.error('Gemini review error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Explain code in simple terms
     */
    async explainCode(code, language = 'javascript') {
        if (!this.enabled) {
            return { success: false, error: 'Gemini not configured' };
        }

        try {
            const prompt = `Explain this ${language} code in simple terms that a beginner could understand. Be concise but thorough.

\`\`\`${language}
${code}
\`\`\`

Explanation:`;

            const response = await this.query(prompt);

            return {
                success: true,
                explanation: response,
                source: 'gemini',
            };
        } catch (error) {
            logger.error('Gemini explain error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Make API request to Google Gemini
     */
    async query(prompt) {
        const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        // Extract text from Gemini response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No response from Gemini');
        }

        return text.trim();
    }

    /**
     * Check if service is available
     */
    isAvailable() {
        return this.enabled;
    }
}

export const geminiService = new GeminiService();
export default geminiService;
