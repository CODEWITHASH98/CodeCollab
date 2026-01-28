/**
 * Production-Ready Structured Logger
 * 
 * Features:
 * - JSON format in production for log aggregation (DataDog, CloudWatch, etc.)
 * - Colored console output in development
 * - Request correlation IDs
 * - Timestamps and log levels
 * - Error stack traces
 */

const isProduction = process.env.NODE_ENV === 'production';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  success: 1,
  socket: 1,
  room: 1,
  warning: 2,
  error: 3,
};

// Minimum log level from environment (default: info in production, debug in dev)
const MIN_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? (isProduction ? 1 : 0);

class Logger {
  constructor() {
    this.correlationId = null;
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id) {
    this.correlationId = id;
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId() {
    this.correlationId = null;
  }

  /**
   * Format log entry
   */
  formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();

    if (isProduction) {
      // Structured JSON for log aggregation
      return JSON.stringify({
        timestamp,
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        correlationId: this.correlationId,
        ...meta,
        ...(meta.error && { stack: meta.error.stack }),
      });
    }

    // Colored console for development
    return { timestamp, level, message, meta };
  }

  /**
   * Core log method
   */
  log(level, color, icon, message, ...args) {
    if (LOG_LEVELS[level] < MIN_LOG_LEVEL) return;

    const meta = args.length > 0 ? args : undefined;

    if (isProduction) {
      const entry = this.formatLog(level, message,
        meta ? { meta: meta.map(a => a instanceof Error ? { message: a.message, stack: a.stack } : a) } : {}
      );

      if (level === 'error') {
        console.error(entry);
      } else if (level === 'warning') {
        console.warn(entry);
      } else {
        console.log(entry);
      }
    } else {
      const timestamp = `${colors.gray}${new Date().toISOString().split('T')[1].slice(0, 8)}${colors.reset}`;
      const prefix = `${timestamp} ${color}${icon} ${level.toUpperCase()}:${colors.reset}`;

      if (level === 'error') {
        console.error(prefix, message, ...args);
      } else if (level === 'warning') {
        console.warn(prefix, message, ...args);
      } else {
        console.log(prefix, message, ...args);
      }
    }
  }

  debug(message, ...args) {
    this.log('debug', colors.gray, '🔍', message, ...args);
  }

  info(message, ...args) {
    this.log('info', colors.blue, 'ℹ', message, ...args);
  }

  success(message, ...args) {
    this.log('success', colors.green, '✓', message, ...args);
  }

  warning(message, ...args) {
    this.log('warning', colors.yellow, '⚠', message, ...args);
  }

  error(message, ...args) {
    this.log('error', colors.red, '✗', message, ...args);
  }

  socket(message, ...args) {
    this.log('socket', colors.magenta, '🔌', message, ...args);
  }

  room(message, ...args) {
    this.log('room', colors.cyan, '🏠', message, ...args);
  }

  /**
   * Create request-scoped logger with correlation ID
   */
  child(correlationId) {
    const childLogger = new Logger();
    childLogger.correlationId = correlationId;
    return childLogger;
  }

  /**
   * Express middleware for request logging with correlation ID
   */
  requestMiddleware() {
    return (req, res, next) => {
      // Generate or use existing correlation ID
      const correlationId = req.headers['x-correlation-id'] ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      req.correlationId = correlationId;
      req.logger = this.child(correlationId);

      // Add to response headers
      res.setHeader('x-correlation-id', correlationId);

      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' :
          res.statusCode >= 400 ? 'warning' : 'info';

        req.logger[level](`${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.headers['user-agent']?.slice(0, 50),
        });
      });

      next();
    };
  }
}

export const logger = new Logger();
export default logger;
