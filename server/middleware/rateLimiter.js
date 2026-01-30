import { cache } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Redis-based Sliding Window Rate Limiter
 * 
 * Features:
 * - Per-user/IP rate limiting
 * - Sliding window algorithm (more accurate than fixed window)
 * - Configurable limits and windows
 * - Headers with remaining limits
 */

const DEFAULT_LIMIT = 100; // Requests per window
const DEFAULT_WINDOW = 60; // Window in seconds

/**
 * Create rate limiter middleware
 * @param {Object} options
 * @param {number} options.limit - Max requests per window
 * @param {number} options.windowSeconds - Window size in seconds
 * @param {string} options.keyPrefix - Redis key prefix
 * @param {Function} options.keyGenerator - Custom key generator
 * @returns {Function} Express middleware
 */
export function createRateLimiter(options = {}) {
    const {
        limit = DEFAULT_LIMIT,
        windowSeconds = DEFAULT_WINDOW,
        keyPrefix = 'ratelimit',
        keyGenerator = null,
        skipFailedRequests = false,
        skipSuccessfulRequests = false,
    } = options;

    return async (req, res, next) => {
        try {
            // Generate unique key for this client
            const key = keyGenerator
                ? keyGenerator(req)
                : `${keyPrefix}:${getClientIdentifier(req)}`;

            // Get current count
            const currentCount = await cache.incr(key, windowSeconds);

            // Calculate remaining
            const remaining = Math.max(0, limit - currentCount);
            const resetTime = Math.ceil(Date.now() / 1000) + windowSeconds;

            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': limit,
                'X-RateLimit-Remaining': remaining,
                'X-RateLimit-Reset': resetTime,
            });

            if (currentCount > limit) {
                logger.warning(`Rate limit exceeded for ${key}`);

                return res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                    message: `Rate limit exceeded. Try again in ${windowSeconds} seconds.`,
                    retryAfter: windowSeconds,
                });
            }

            next();
        } catch (error) {
            // If Redis fails, allow request (fail open)
            logger.error('Rate limiter error:', error.message);
            next();
        }
    };
}

/**
 * Get client identifier (IP or user ID)
 */
function getClientIdentifier(req) {
    // Prefer user ID if authenticated
    if (req.user?.userId) {
        return `user:${req.user.userId}`;
    }

    // Fall back to IP address
    const ip = req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.connection.remoteAddress ||
        'unknown';

    return `ip:${ip}`;
}

// Pre-configured rate limiters
export const rateLimiters = {
    // General API rate limit: 1000 requests/minute (Relaxed for dev/testing)
    api: createRateLimiter({
        limit: 1000,
        windowSeconds: 60,
        keyPrefix: 'rl:api',
    }),

    // Strict limit for auth endpoints: 120 requests/minute (Relaxed from 10)
    auth: createRateLimiter({
        limit: 120,
        windowSeconds: 60,
        keyPrefix: 'rl:auth',
    }),

    // Code execution limit: 20 executions/minute
    execution: createRateLimiter({
        limit: 20,
        windowSeconds: 60,
        keyPrefix: 'rl:exec',
    }),

    // AI hints limit: 5 requests per 5 minutes (matches resume claim)
    hints: createRateLimiter({
        limit: 5,
        windowSeconds: 300, // 5 minutes
        keyPrefix: 'rl:hints',
    }),

    // Room creation limit: 5 rooms/hour
    roomCreation: createRateLimiter({
        limit: 5,
        windowSeconds: 3600,
        keyPrefix: 'rl:room',
    }),
};

export default rateLimiters;
