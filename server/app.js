import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import './config/env.js';
import { validateEnv } from './config/envValidator.js';
import { initSentry, captureException } from './config/sentry.js';
import prisma from './config/database.js';

// Validate environment variables early
validateEnv();

import authRoutes from './routes/authRoutes.js';
import passport from './services/oauthService.js';

import { initializeSocket } from './config/socket.js';
import { CONFIG } from './config/constants.js';
import { SocketController } from './controllers/socketController.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiters } from './middleware/rateLimiter.js';
import { csrfProtection, csrfTokenEndpoint } from './middleware/csrfMiddleware.js';
import { logger } from './utils/logger.js';
import { redisClient, cache } from './config/redis.js';
import { executionWorker } from './workers/executionWorker.js';
import { getQueueStats, closeQueue } from './queues/executionQueue.js';

// Routes
import roomRoutes from './routes/roomRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';

import dotenv from 'dotenv';
dotenv.config();

// Server start time for uptime tracking
const SERVER_START_TIME = Date.now();

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Initialize Sentry (must be before other middleware)
const sentry = initSentry(app);
app.use(sentry.requestHandler);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Initialize Socket Controller
const socketController = new SocketController(io);

// Socket.io connection handler
io.on('connection', (socket) => {
  socketController.handleConnection(socket);
});

// ========== Security Middleware ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: CONFIG.CLIENT_URL,
  credentials: true,
}));

// Cookie parser (for CSRF tokens)
app.use(cookieParser());

// ========== Body Parsing ==========
app.use(express.json({ limit: '1mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }
  next(err);
});

app.use(express.urlencoded({ extended: true }));

// CSRF Protection (Disabled - using Bearer tokens)
// app.use(csrfProtection({ enabled: process.env.NODE_ENV === 'production' }));

// CSRF Token endpoint
// app.get('/api/csrf-token', csrfTokenEndpoint);

// Passport initialization (for OAuth only, no sessions)
app.use(passport.initialize());

// Request logging with timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ========== Health Check Endpoints ==========

// Liveness probe - is the server running?
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
  });
});

// Readiness probe - is the server ready to accept traffic?
app.get('/ready', async (req, res) => {
  try {
    // Check database health
    let dbHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (dbError) {
      logger.error('Database health check failed:', dbError.message);
    }

    const checks = {
      redis: await redisClient.isHealthy(),
      database: dbHealthy,
    };

    const allHealthy = Object.values(checks).every(Boolean);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const queueStats = await getQueueStats();

    res.json({
      uptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
      memory: process.memoryUsage(),
      queue: queueStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Info
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'CodeCollab Pro API',
    version: '2.0.0',
    description: 'Real-time collaborative coding platform for technical interviews',
    status: 'running',
    environment: CONFIG.NODE_ENV,
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      api: '/api/v1',
      docs: '/api/docs',
    },
    timestamp: new Date().toISOString(),
  });
});

// ========== API Routes (v1) ==========
app.use('/api/auth', rateLimiters.auth, authRoutes);
app.use('/api/rooms', rateLimiters.api, roomRoutes);
app.use('/api/execute', rateLimiters.execution, executionRoutes);
app.use('/api/analytics', rateLimiters.api, analyticsRoutes);

// Versioned API routes
app.use('/api/v1/auth', rateLimiters.auth, authRoutes);
app.use('/api/v1/rooms', rateLimiters.api, roomRoutes);
app.use('/api/v1/execute', rateLimiters.execution, executionRoutes);
app.use('/api/v1/analytics', rateLimiters.api, analyticsRoutes);
app.use('/api/v1/metrics', metricsRoutes); // No rate limiting for metrics

// ========== Error Handling ==========
app.use(notFoundHandler);
app.use(sentry.errorHandler); // Sentry error handler (before custom)
app.use(errorHandler);

// ========== Initialize Services ==========
async function initializeServices() {
  try {
    // Connect to Redis with a timeout to prevent hanging the startup
    const redisTimeout = setTimeout(() => {
      logger.warning('Redis connection taking longer than expected...');
    }, 5000);

    await redisClient.connect();
    clearTimeout(redisTimeout);
    logger.success('Redis connections established');

    // Start execution worker
    executionWorker.start();
    logger.success('Execution worker initialized');

  } catch (error) {
    logger.error('Service initialization failed:', error.message);
    logger.warning('Graceful degradation: Some features (cache, code execution queue) may be unavailable.');
    // Don't throw, allow the server to start for basic API usage
  }
}

// ========== Graceful Shutdown ==========
async function gracefulShutdown(signal) {
  logger.warning(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Stop execution worker
      await executionWorker.stop();
      logger.info('Execution worker stopped');

      // Close queue
      await closeQueue();
      logger.info('Execution queue closed');

      // Disconnect Redis
      await redisClient.disconnect();
      logger.info('Redis disconnected');

      logger.success('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error.message);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ========== Start Server ==========
async function startServer() {
  await initializeServices();

  httpServer.listen(CONFIG.PORT, () => {
    console.log('\n' + '='.repeat(50));
    logger.success(`🚀 CodeCollab Pro API v2.0.0`);
    logger.success(`📡 Server: http://localhost:${CONFIG.PORT}`);
    logger.success(`🔧 Environment: ${CONFIG.NODE_ENV}`);
    logger.success(`🌐 Client: ${CONFIG.CLIENT_URL}`);
    logger.socket('⚡ WebSocket server ready');
    console.log('='.repeat(50) + '\n');
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, io };
// Server stability verified 2.0.