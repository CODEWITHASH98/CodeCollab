/**
 * Sentry Error Tracking Configuration
 * 
 * Free tier: 5K errors/month
 * Get your DSN at: https://sentry.io
 */

import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger.js';

export function initSentry(app) {
    if (!process.env.SENTRY_DSN) {
        logger.info('Sentry DSN not configured, error tracking disabled');
        return { requestHandler: (req, res, next) => next(), errorHandler: (err, req, res, next) => next(err) };
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.npm_package_version || '2.0.0',

        // Performance monitoring (sample 10% of transactions)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Filter out common noise
        ignoreErrors: [
            'TokenExpiredError',
            'JsonWebTokenError',
            'ECONNRESET',
            'ETIMEDOUT',
        ],

        // Don't send PII by default
        sendDefaultPii: false,

        // Attach request data
        integrations: [
            Sentry.httpIntegration({ tracing: true }),
            Sentry.expressIntegration({ app }),
        ],
    });

    logger.success('Sentry error tracking initialized');

    return {
        requestHandler: Sentry.Handlers.requestHandler(),
        errorHandler: Sentry.Handlers.errorHandler({
            shouldHandleError(error) {
                // Only report 5xx errors
                return error.status === undefined || error.status >= 500;
            },
        }),
    };
}

export function captureException(error, context = {}) {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(error, { extra: context });
    }
}

export function captureMessage(message, level = 'info') {
    if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, level);
    }
}

export default { initSentry, captureException, captureMessage };
