/**
 * CSRF Protection Middleware
 * 
 * Implements Double Submit Cookie pattern:
 * 1. Server sets a CSRF token in a cookie
 * 2. Client must include this token in request header
 * 3. Server validates token matches
 * 
 * This protects against Cross-Site Request Forgery attacks.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Paths exempt from CSRF (e.g., OAuth callbacks, webhooks)
const EXEMPT_PATHS = [
  '/api/auth/google/callback',
  '/api/auth/github/callback',
  '/health',
  '/ready',
  '/metrics',
];

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF Protection Middleware
 * 
 * @param {Object} options
 * @param {boolean} options.enabled - Enable/disable CSRF protection
 * @param {string[]} options.exemptPaths - Additional paths to exempt
 */
export function csrfProtection(options = {}) {
  const {
    enabled = process.env.NODE_ENV === 'production',
    exemptPaths = [],
  } = options;

  const allExemptPaths = [...EXEMPT_PATHS, ...exemptPaths];

  return (req, res, next) => {
    // Skip if disabled (development mode)
    if (!enabled) {
      return next();
    }

    // Generate token if not exists
    let token = req.cookies?.[CSRF_COOKIE_NAME];
    if (!token) {
      token = generateToken();
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Attach token to response locals (for API responses)
    res.locals.csrfToken = token;

    // Skip validation for safe methods
    if (!PROTECTED_METHODS.includes(req.method)) {
      return next();
    }

    // Skip validation for exempt paths
    if (allExemptPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Validate CSRF token
    const headerToken = req.headers[CSRF_HEADER_NAME];
    
    if (!headerToken || headerToken !== token) {
      logger.warning(`CSRF validation failed for ${req.method} ${req.path}`);
      return res.status(403).json({
        success: false,
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token. Please refresh and try again.',
      });
    }

    next();
  };
}

/**
 * Endpoint to get CSRF token
 * Client should call this on page load
 */
export function csrfTokenEndpoint(req, res) {
  const token = req.cookies?.[CSRF_COOKIE_NAME] || generateToken();
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { csrfToken: token },
  });
}

export default csrfProtection;
