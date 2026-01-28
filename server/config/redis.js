import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

// Redis configuration with connection pooling and error handling
// Redis configuration with connection pooling and error handling
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Fix: Sanitize REDIS_URL if user copied "redis-cli -u ..." comamnd
if (REDIS_URL.includes(' -u ')) {
  console.warn("⚠️ Detected CLI flags in REDIS_URL. Sanitizing...");
  const match = REDIS_URL.match(/(redis|rediss):\/\/[^\s"]+/);
  if (match) {
    REDIS_URL = match[0];
  }
}

// Trim whitespace and remove quotes if present
REDIS_URL = REDIS_URL.trim().replace(/^["']|["']$/g, '');

class RedisClient {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
  }

  // Main Redis client for caching
  getClient() {
    if (!this.client) {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // REQUIRED for BullMQ
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.success('Redis client connected');
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warning('Redis connection closed');
        this.isConnected = false;
      });
    }

    return this.client;
  }

  // Subscriber for Pub/Sub (real-time room sync)
  getSubscriber() {
    if (!this.subscriber) {
      this.subscriber = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      this.subscriber.on('connect', () => {
        logger.success('Redis subscriber connected');
      });

      this.subscriber.on('error', (err) => {
        logger.error('Redis subscriber error:', err.message);
      });
    }

    return this.subscriber;
  }

  // Publisher for Pub/Sub
  getPublisher() {
    if (!this.publisher) {
      this.publisher = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });

      this.publisher.on('connect', () => {
        logger.success('Redis publisher connected');
      });

      this.publisher.on('error', (err) => {
        logger.error('Redis publisher error:', err.message);
      });
    }

    return this.publisher;
  }

  // Connect all clients - with graceful fallback if Redis unavailable
  async connect() {
    try {
      await Promise.race([
        Promise.all([
          this.getClient().connect(),
          this.getSubscriber().connect(),
          this.getPublisher().connect(),
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);
      logger.success('All Redis connections established');
    } catch (error) {
      logger.warning('Redis unavailable - running without cache:', error.message);
      // Don't throw - allow server to run without Redis
      this.isConnected = false;
    }
  }

  // Graceful disconnect
  async disconnect() {
    try {
      await Promise.all([
        this.client?.quit(),
        this.subscriber?.quit(),
        this.publisher?.quit(),
      ]);
      logger.info('Redis connections closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connections:', error.message);
    }
  }

  // Health check
  async isHealthy() {
    try {
      const client = this.getClient();
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }
}

// Cache helper functions
export const cache = {
  // Get with automatic JSON parsing
  async get(key) {
    try {
      const client = redisClient.getClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error for ${key}:`, error.message);
      return null;
    }
  },

  // Set with TTL and JSON stringify
  async set(key, value, ttlSeconds = 3600) {
    try {
      const client = redisClient.getClient();
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for ${key}:`, error.message);
      return false;
    }
  },

  // Delete key
  async del(key) {
    try {
      const client = redisClient.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for ${key}:`, error.message);
      return false;
    }
  },

  // Increment counter (for rate limiting)
  async incr(key, ttlSeconds = 60) {
    try {
      const client = redisClient.getClient();
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      logger.error(`Cache incr error for ${key}:`, error.message);
      return 0;
    }
  },
};

// Room state caching
export const roomCache = {
  // Cache room state
  async setRoom(roomId, roomData, ttlSeconds = 86400) {
    return cache.set(`room:${roomId}`, roomData, ttlSeconds);
  },

  // Get room state
  async getRoom(roomId) {
    return cache.get(`room:${roomId}`);
  },

  // Delete room from cache
  async deleteRoom(roomId) {
    return cache.del(`room:${roomId}`);
  },

  // Cache user session
  async setUserSession(userId, sessionData, ttlSeconds = 86400) {
    return cache.set(`session:${userId}`, sessionData, ttlSeconds);
  },

  // Get user session
  async getUserSession(userId) {
    return cache.get(`session:${userId}`);
  },
};

// Singleton instance
export const redisClient = new RedisClient();

export default redisClient;
