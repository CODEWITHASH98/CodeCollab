/**
 * HuggingFace AI Service
 * 
 * Free tier integration for:
 * - Code completion
 * - Code explanation
 * - Code review
 * - Bug detection
 * 
 * Uses HuggingFace Inference API (free tier: 30k tokens/month)
 */

import { logger } from '../utils/logger.js';
import { cache } from '../config/redis.js';

// HuggingFace API endpoint (NEW required URL as of 2024)
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models';

// Free models that work on HuggingFace Inference API (no Pro required)
const MODELS = {
    // Using smaller, definitely-free models
    textGen: 'google/flan-t5-base',           // Fast, free, good for text tasks
    codeGen: 'Salesforce/codegen-350M-mono',  // Small code model, free tier
    fallback: 'google/flan-t5-small',         // Smallest, fastest fallback
};

class HuggingFaceService {
    constructor() {
        this.apiKey = process.env.HUGGINGFACE_API_KEY || null;
        this.enabled = !!this.apiKey;

        if (!this.enabled) {
            logger.warning('HuggingFace API key not configured. AI features will use fallback.');
        }
    }

    /**
     * Generate code completion
     */
    async generateCode(prompt, language = 'javascript') {
        if (!this.enabled) {
            return this.getFallbackResponse('code_generation');
        }

        try {
            const systemPrompt = `Complete the following ${language} code:\n\n${prompt}`;

            const response = await this.query(MODELS.codeGen, {
                inputs: systemPrompt,
                parameters: {
                    max_new_tokens: 200,
                    temperature: 0.7,
                    top_p: 0.95,
                    return_full_text: false,
                },
            });

            return {
                success: true,
                completion: response[0]?.generated_text || '',
                model: MODELS.codeGen,
            };
        } catch (error) {
            logger.error('HuggingFace code generation error:', error.message);
            return this.getFallbackResponse('code_generation');
        }
    }

    /**
     * Explain code
     */
    async explainCode(code, language = 'javascript') {
        if (!this.enabled) {
            return this.getCodeExplanationFallback(code, language);
        }

        try {
            const prompt = `Explain what this ${language} code does in simple terms:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplanation:`;

            const response = await this.query(MODELS.textGen, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 300,
                    temperature: 0.5,
                },
            });

            return {
                success: true,
                explanation: response[0]?.generated_text || 'Unable to generate explanation',
                model: MODELS.textGen,
            };
        } catch (error) {
            logger.error('HuggingFace explanation error:', error.message);
            return this.getCodeExplanationFallback(code, language);
        }
    }

    /**
     * Review code for issues
     */
    async reviewCode(code, language = 'javascript') {
        if (!this.enabled) {
            return this.getCodeReviewFallback(code, language);
        }

        try {
            const prompt = `Review this ${language} code and identify potential issues, bugs, or improvements:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nCode Review:`;

            const response = await this.query(MODELS.textGen, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 400,
                    temperature: 0.3,
                },
            });

            return {
                success: true,
                review: response[0]?.generated_text || 'Unable to generate review',
                model: MODELS.textGen,
                source: 'huggingface',
            };
        } catch (error) {
            logger.error('HuggingFace review error:', error.message);
            return this.getCodeReviewFallback(code, language);
        }
    }

    /**
     * Generate intelligent hint
     */
    async generateHint(code, problemDescription = '') {
        // Check cache first
        const cacheKey = `hint:${this.hashCode(code)}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return { ...cached, cached: true };
        }

        if (!this.enabled) {
            return this.getHintFallback(code);
        }

        try {
            const prompt = `Given this code:\n\`\`\`\n${code}\n\`\`\`\n${problemDescription ? `Problem: ${problemDescription}\n` : ''}Provide a helpful hint (don't give the solution):`;

            const response = await this.query(MODELS.textGen, {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 150,
                    temperature: 0.7,
                },
            });

            const result = {
                success: true,
                hint: response[0]?.generated_text || this.getRandomHint(),
                type: 'ai',
                model: MODELS.textGen,
            };

            // Cache for 5 minutes
            await cache.set(cacheKey, result, 300);

            return result;
        } catch (error) {
            logger.error('HuggingFace hint error:', error.message);
            return this.getHintFallback(code);
        }
    }

    /**
     * Make API request to HuggingFace
     */
    async query(model, payload) {
        const response = await fetch(`${HF_API_URL}/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    /**
     * Fallback responses when API is unavailable
     */
    getFallbackResponse(type) {
        return {
            success: false,
            message: 'AI service unavailable. Using fallback.',
            source: 'fallback',
        };
    }

    getCodeExplanationFallback(code, language) {
        const lineCount = code.split('\n').length;
        const hasFunction = /function|def |fn |func /.test(code);
        const hasLoop = /for|while|loop/.test(code);
        const hasConditional = /if|else|switch|match/.test(code);

        let explanation = `This ${language} code contains ${lineCount} lines. `;
        if (hasFunction) explanation += 'It defines one or more functions. ';
        if (hasLoop) explanation += 'It includes loop structures for iteration. ';
        if (hasConditional) explanation += 'It uses conditional logic for decision making. ';

        return {
            success: true,
            explanation,
            source: 'fallback',
        };
    }

    getCodeReviewFallback(code, language) {
        const issues = [];

        // Basic static analysis
        if (code.includes('console.log') && language === 'javascript') {
            issues.push('Consider removing console.log statements for production');
        }
        if (code.includes('var ') && language === 'javascript') {
            issues.push('Consider using let/const instead of var');
        }
        if (code.includes('==') && !code.includes('===')) {
            issues.push('Consider using strict equality (===) instead of loose equality (==)');
        }
        if (code.length > 500 && !code.includes('function') && !code.includes('def ')) {
            issues.push('Consider breaking this into smaller functions');
        }
        if (!code.includes('try') && (code.includes('fetch') || code.includes('await'))) {
            issues.push('Consider adding try-catch for async operations');
        }

        return {
            success: true,
            review: issues.length > 0 ? issues.join('\n• ') : 'No obvious issues detected.',
            suggestions: issues,
            source: 'fallback',
        };
    }

    getHintFallback(code) {
        const hints = [
            'Think about edge cases: empty input, single element, negative numbers',
            'Consider the time complexity - can you optimize it?',
            'Have you handled all error cases?',
            'Could a hash map improve lookup time?',
            'Try breaking the problem into smaller steps',
            'Consider using two pointers technique',
            'Think about the space-time tradeoff',
            'Write out a few examples to find the pattern',
        ];

        return {
            success: true,
            hint: hints[Math.floor(Math.random() * hints.length)],
            type: 'fallback',
        };
    }

    getRandomHint() {
        const hints = [
            'Consider edge cases in your solution',
            'Think about the time complexity',
            'Could you use a different data structure?',
        ];
        return hints[Math.floor(Math.random() * hints.length)];
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
}

export const huggingFaceService = new HuggingFaceService();
export default huggingFaceService;
