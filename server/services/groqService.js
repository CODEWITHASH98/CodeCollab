/**
 * Groq AI Service
 * 
 * Super fast inference with Llama models
 * Free tier: 14,400 tokens/min
 * 
 * Docs: https://console.groq.com/docs
 */

import { logger } from '../utils/logger.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Available models (verified from Groq API Jan 2025)
const MODELS = {
    fast: 'llama-3.1-8b-instant',       // Fast, good for hints
    balanced: 'llama-3.3-70b-versatile', // Best quality/speed balance
    code: 'llama-3.3-70b-versatile',     // Best for code tasks
};

class GroqService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY || null;
        this.enabled = !!this.apiKey;

        if (this.enabled) {
            logger.success('Groq AI service enabled');
        } else {
            logger.warning('Groq API key not configured');
        }
    }

    /**
     * Generate coding hint
     */
    async generateHint(code, problemDescription = '') {
        if (!this.enabled) {
            return null;
        }

        try {
            const response = await this.chat([
                {
                    role: 'system',
                    content: `You are a coding interview assistant. Provide HINTS only, never complete solutions.
Rules:
1. Never give the answer directly
2. Ask guiding questions
3. Point out potential issues
4. Suggest algorithms/data structures
5. Keep hints to 2-3 sentences max`,
                },
                {
                    role: 'user',
                    content: `Code:\n\`\`\`\n${code}\n\`\`\`\n${problemDescription ? `Problem: ${problemDescription}\n` : ''}Give a helpful hint:`,
                },
            ], MODELS.fast);

            return {
                hint: response,
                type: 'ai',
                provider: 'groq',
                model: MODELS.fast,
            };
        } catch (error) {
            logger.error('Groq hint error:', error.message);
            return null;
        }
    }

    /**
     * Review code for quality
     */
    async reviewCode(code, language) {
        if (!this.enabled) {
            return null;
        }

        try {
            const response = await this.chat([
                {
                    role: 'system',
                    content: `You are a senior code reviewer. Analyze code and respond with JSON only (no markdown, no code fences):
{
  "score": 1-10,
  "summary": "One line summary",
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1"],
  "complexity": {"time": "O(n)", "space": "O(1)"}
}`,
                },
                {
                    role: 'user',
                    content: `Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
                },
            ], MODELS.code);

            try {
                // Strip markdown code fences if present
                let cleanedResponse = response.trim();
                if (cleanedResponse.startsWith('```')) {
                    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
                }
                return { ...JSON.parse(cleanedResponse), provider: 'groq' };
            } catch {
                // If JSON parsing still fails, extract any JSON object from the response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        return { ...JSON.parse(jsonMatch[0]), provider: 'groq' };
                    } catch {
                        return { summary: response, provider: 'groq' };
                    }
                }
                return { summary: response, provider: 'groq' };
            }
        } catch (error) {
            logger.error('Groq review error:', error.message);
            return null;
        }
    }

    /**
     * Explain code
     */
    async explainCode(code, language) {
        if (!this.enabled) {
            return null;
        }

        try {
            const response = await this.chat([
                {
                    role: 'system',
                    content: 'Explain code clearly and concisely. Include time/space complexity analysis.',
                },
                {
                    role: 'user',
                    content: `Explain this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
                },
            ], MODELS.balanced);

            return {
                explanation: response,
                provider: 'groq',
            };
        } catch (error) {
            logger.error('Groq explain error:', error.message);
            return null;
        }
    }

    /**
     * Make chat completion request
     */
    async chat(messages, model = MODELS.fast) {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    /**
     * Check if service is available
     */
    isAvailable() {
        return this.enabled;
    }
}

export const groqService = new GroqService();
export default groqService;
