/**
 * Unified AI Service
 * 
 * Combines multiple AI providers:
 * - Groq (fastest, free tier)
 * - OpenAI GPT-4 (premium)
 * - Google Gemini (free tier, reliable)
 * - Local fallbacks
 * 
 * Automatic failover: Groq → OpenAI → Gemini → Fallback
 */

import OpenAI from 'openai';
import crypto from 'crypto';
import { groqService } from './groqService.js';
import { geminiService } from './geminiService.js';
import { CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { cache } from '../config/redis.js';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

class UnifiedAIService {
  constructor() {
    this.providers = {
      groq: !!process.env.GROQ_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    };

    // Stats tracking for cache hit rate validation
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      hintRequests: 0,
      reviewRequests: 0,
      explainRequests: 0,
      startTime: Date.now(),
    };

    logger.info('AI Providers:', this.providers);

    // Hint templates for offline fallback
    this.hintTemplates = [
      { pattern: /for.*loop/i, hint: 'Consider using array methods like map(), filter(), or reduce()' },
      { pattern: /if.*else.*if/i, hint: 'Multiple if-else can be replaced with switch or object lookup' },
      { pattern: /\.length/i, hint: 'Check edge cases: empty arrays, null values' },
      { pattern: /sort/i, hint: 'JavaScript sort() mutates the array. Use [...arr].sort()' },
      { pattern: /async|await|promise/i, hint: 'Always handle promise rejections with try-catch' },
      { pattern: /recursion|recursive/i, hint: 'Ensure base case is correct and consider stack overflow' },
      { pattern: /\.push|\.pop/i, hint: 'Consider if a different data structure would be more efficient' },
      { pattern: /indexOf|includes/i, hint: 'For frequent lookups, use Set or Map for O(1) access' },
    ];

    this.generalHints = [
      'Think about time complexity - can you optimize from O(n²) to O(n)?',
      'Consider edge cases: empty input, single element, negative numbers, duplicates',
      'Are you handling all error cases? What if the input is invalid?',
      'Can you break this problem into smaller, reusable functions?',
      'Have you considered using a hash map to improve lookup time?',
      'Try writing out a few examples manually - do you see a pattern?',
      'Is there a way to solve this with two pointers or sliding window?',
      'Consider the space-time tradeoff - can you trade memory for speed?',
      'Would sorting the input first make the problem easier?',
      'Think about whether this could be solved with dynamic programming',
    ];
  }

  /**
   * Generate intelligent coding hint
   */
  async generateHint(code, problemId, userId, _room) {
    // Check cooldown
    const cooldownKey = `hint:cooldown:${userId}`;
    const lastRequest = await cache.get(cooldownKey);

    if (lastRequest) {
      const waitTime = Math.ceil((CONFIG.AI.HINT_COOLDOWN - (Date.now() - lastRequest)) / 1000);
      if (waitTime > 0) {
        return { hint: `Please wait ${waitTime} seconds`, type: 'cooldown' };
      }
    }

    // Set cooldown
    await cache.set(cooldownKey, Date.now(), CONFIG.AI.HINT_COOLDOWN / 1000);

    // Try providers in order: Groq (fastest) > OpenAI > HuggingFace > Fallback
    if (this.providers.groq) {
      try {
        const result = await groqService.generateHint(code, problemId);
        if (result) return result;
      } catch (error) {
        logger.error('Groq hint failed, trying OpenAI:', error.message);
      }
    }

    if (this.providers.openai) {
      try {
        return await this.getOpenAIHint(code, problemId);
      } catch (error) {
        logger.error('OpenAI hint failed, trying HuggingFace:', error.message);
      }
    }

    // Try Gemini fallback
    if (this.providers.gemini) {
      try {
        const result = await geminiService.generateHint(code, problemId);
        if (result) return result;
      } catch (error) {
        logger.error('Gemini hint failed, using template fallback:', error.message);
      }
    }

    return this.getTemplateHint(code);
  }

  /**
   * OpenAI GPT-4 hint generation
   */
  async getOpenAIHint(code, problemId) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a coding interview assistant. Provide HINTS only, never solutions.
Rules:
1. Never give complete solutions
2. Guide with questions
3. Point out potential issues
4. Suggest algorithms/data structures
5. Keep hints to 2-3 sentences`,
        },
        {
          role: 'user',
          content: `Candidate's code:\n\`\`\`\n${code}\n\`\`\`\n\nProvide a helpful hint:`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return {
      hint: response.choices[0]?.message?.content || this.generalHints[0],
      type: 'ai',
      provider: 'openai',
    };
  }

  /**
   * Helper: Get cache key
   */
  getCacheKey(prefix, content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Helper: Clean JSON output from LLM
   */
  cleanJsonOutput(content) {
    if (!content) return null;
    // Strip markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
    const cleanContent = jsonMatch ? jsonMatch[1] : content;
    return cleanContent.trim();
  }

  /**
   * Review code for quality and issues
   */
  async reviewCode(code, language, userId) {
    // Track request stats
    this.stats.totalRequests++;
    this.stats.reviewRequests++;

    // 1. Check Cache FIRST (cached results don't need cooldown)
    const cacheKey = this.getCacheKey(`review:${language}`, code);
    logger.info(`Checking cache with key: ${cacheKey.substring(0, 30)}...`);
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      this.stats.cacheHits++;
      logger.success(`Cache HIT for review (${this.stats.cacheHits} hits / ${this.stats.cacheMisses} misses)`);
      return { ...cachedResult, cached: true };
    }
    logger.info('Cache MISS - fetching from AI');

    // 2. Check Rate Limit (only for new AI requests)
    const cooldownKey = `review:cooldown:${userId}`;
    const lastRequest = await cache.get(cooldownKey);
    logger.info(`Cooldown check - userId: ${userId}, lastRequest: ${lastRequest}`);
    if (lastRequest) {
      const waitTime = Math.ceil((CONFIG.AI.REVIEW_COOLDOWN - (Date.now() - lastRequest)) / 1000);
      logger.info(`Cooldown active - waitTime: ${waitTime}s`);
      if (waitTime > 0) {
        return { error: `Please wait ${waitTime} seconds before next review`, type: 'cooldown' };
      }
    }

    // Cache miss - making AI request
    this.stats.cacheMisses++;

    // Set cooldown
    await cache.set(cooldownKey, Date.now(), CONFIG.AI.REVIEW_COOLDOWN / 1000);

    // Try Groq first (fastest, free)
    if (this.providers.groq) {
      try {
        logger.info('Trying Groq for review...');
        const groqResult = await groqService.reviewCode(code, language);
        if (groqResult && !groqResult.error) {
          const result = { ...groqResult, provider: 'groq' };
          logger.success('Groq review success - caching result');
          await cache.set(cacheKey, result, CONFIG.AI.CACHE_TTL);
          logger.info(`Cached with TTL: ${CONFIG.AI.CACHE_TTL}s`);
          return result;
        }
        logger.warning('Groq returned empty or error result');
      } catch (error) {
        logger.error('Groq review failed:', error.message);
      }
    }

    // Try OpenAI (premium)
    if (this.providers.openai) {
      try {
        const response = await openai.chat.completions.create({
          model: CONFIG.AI.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a strict, senior code reviewer. Analyze the code for security, performance, and style.
              Output VALID JSON only:
{
  "score": 1-10,
  "summary": "Professional summary",
  "issues": ["Critical: XSS vulnerability", "Performance: O(n^2) detected"],
  "suggestions": ["Use parameterized queries", "Optimize loop"],
  "complexity": { "time": "O(n)", "space": "O(1)" }
}`,
            },
            {
              role: 'user',
              content: `Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          ],
          max_tokens: CONFIG.AI.MAX_TOKENS,
          temperature: 0.3,
        });

        const content = this.cleanJsonOutput(response.choices[0]?.message?.content);
        let result;
        try {
          result = { ...JSON.parse(content), provider: 'openai' };
        } catch (e) {
          logger.error('JSON parse error in review:', e.message, content);
          result = { summary: 'Analysis completed but format was invalid.', details: content, provider: 'openai', score: 5, issues: [], suggestions: [] };
        }

        // Cache the result
        await cache.set(cacheKey, result, CONFIG.AI.CACHE_TTL);
        return result;

      } catch (error) {
        logger.error('OpenAI review failed:', error.message);
      }
    }

    // Try Gemini
    if (this.providers.gemini) {
      const geminiResult = await geminiService.reviewCode(code, language);
      if (geminiResult.success) {
        await cache.set(cacheKey, geminiResult, CONFIG.AI.CACHE_TTL);
        return geminiResult;
      }
    }

    // Fallback to static analysis
    return this.staticCodeReview(code, language);
  }

  /**
   * Explain code solution
   */
  async explainCode(code, language, userId) {
    // Track request stats
    this.stats.totalRequests++;
    this.stats.explainRequests++;

    // 1. Check Cache FIRST (cached results don't need cooldown)
    const cacheKey = this.getCacheKey(`explain:${language}`, code);
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      this.stats.cacheHits++;
      logger.info(`Cache HIT for explain (${this.stats.cacheHits}/${this.stats.cacheHits + this.stats.cacheMisses})`);
      return { ...cachedResult, cached: true };
    }

    // 2. Check Rate Limit (only for new AI requests)
    const cooldownKey = `explain:cooldown:${userId}`;
    const lastRequest = await cache.get(cooldownKey);
    if (lastRequest) {
      const waitTime = Math.ceil((CONFIG.AI.EXPLAIN_COOLDOWN - (Date.now() - lastRequest)) / 1000);
      if (waitTime > 0) {
        return { explanation: `Please wait ${waitTime} seconds before next explanation`, type: 'cooldown' };
      }
    }

    // Cache miss - making AI request
    this.stats.cacheMisses++;

    // Set cooldown
    await cache.set(cooldownKey, Date.now(), CONFIG.AI.EXPLAIN_COOLDOWN / 1000);

    // Try Groq first (fastest, free)
    if (this.providers.groq) {
      try {
        const groqResult = await groqService.explainCode(code, language);
        if (groqResult && !groqResult.error) {
          const result = { ...groqResult, provider: 'groq' };
          await cache.set(cacheKey, result, CONFIG.AI.CACHE_TTL);
          return result;
        }
      } catch (error) {
        logger.error('Groq explain failed:', error.message);
      }
    }

    // Try OpenAI (premium)
    if (this.providers.openai) {
      try {
        const response = await openai.chat.completions.create({
          model: CONFIG.AI.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Explain this code professionally. Break down the logic, time/space complexity, and any security implications. Keep it concise but thorough.',
            },
            {
              role: 'user',
              content: `Explain this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          ],
          max_tokens: CONFIG.AI.MAX_TOKENS,
          temperature: 0.5,
        });

        const result = {
          explanation: response.choices[0]?.message?.content,
          provider: 'openai',
        };

        // Cache result
        await cache.set(cacheKey, result, CONFIG.AI.CACHE_TTL);
        return result;

      } catch (error) {
        logger.error('OpenAI explain failed:', error.message);
      }
    }

    if (this.providers.gemini) {
      const geminiResult = await geminiService.explainCode(code, language);
      if (geminiResult.success) {
        await cache.set(cacheKey, geminiResult, CONFIG.AI.CACHE_TTL);
        return geminiResult;
      }
    }

    return { explanation: 'AI explanation not available', provider: 'fallback' };
  }

  /**
   * Template-based hint (offline fallback)
   */
  getTemplateHint(code) {
    for (const template of this.hintTemplates) {
      if (template.pattern.test(code)) {
        return { hint: template.hint, type: 'pattern' };
      }
    }

    const randomHint = this.generalHints[Math.floor(Math.random() * this.generalHints.length)];
    return { hint: randomHint, type: 'general' };
  }

  /**
   * Static code review (no AI needed)
   */
  staticCodeReview(code, language) {
    const issues = [];
    const suggestions = [];

    // JavaScript specific
    if (language === 'javascript' || language === 'typescript') {
      if (code.includes('var ')) {
        issues.push('Using var instead of let/const');
        suggestions.push('Replace var with let or const');
      }
      if (code.includes('==') && !code.includes('===')) {
        issues.push('Using loose equality (==)');
        suggestions.push('Use strict equality (===)');
      }
      if (code.includes('console.log')) {
        suggestions.push('Remove console.log for production');
      }
      if (!code.includes('try') && code.includes('await')) {
        issues.push('Async code without error handling');
        suggestions.push('Wrap async operations in try-catch');
      }
    }

    // Python specific
    if (language === 'python') {
      if (code.includes('except:') && !code.includes('except Exception')) {
        issues.push('Bare except clause');
        suggestions.push('Use specific exception types');
      }
      if (code.includes('print(') && code.includes('def ')) {
        suggestions.push('Consider using logging instead of print');
      }
    }

    // General
    if (code.split('\n').length > 50 && !code.includes('function') && !code.includes('def ')) {
      suggestions.push('Consider breaking into smaller functions');
    }

    const score = Math.max(1, 10 - issues.length * 2);

    return {
      score,
      summary: issues.length === 0 ? 'Code looks good!' : `Found ${issues.length} potential issues`,
      issues,
      suggestions,
      provider: 'static',
    };
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      providers: this.providers,
      available: Object.values(this.providers).some(Boolean) || true, // Fallback always available
    };
  }

  /**
   * Get cache and request statistics
   * Used for validating resume claims about cache hit rates
   */
  getStats() {
    const hitRate = this.getCacheHitRate();
    const uptimeMs = Date.now() - this.stats.startTime;

    return {
      ...this.stats,
      cacheHitRate: hitRate,
      cacheHitRateFormatted: `${hitRate.toFixed(2)}%`,
      uptimeMs,
      uptimeFormatted: this.formatUptime(uptimeMs),
    };
  }

  /**
   * Get cache hit rate as percentage
   */
  getCacheHitRate() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    if (total === 0) return 0;
    return (this.stats.cacheHits / total) * 100;
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      hintRequests: 0,
      reviewRequests: 0,
      explainRequests: 0,
      startTime: Date.now(),
    };
    logger.info('AI service stats reset');
  }

  /**
   * Format uptime in human readable format
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

export const aiService = new UnifiedAIService();
export default aiService;
