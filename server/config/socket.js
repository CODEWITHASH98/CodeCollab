import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { CONFIG } from "./constants.js";
import { redisClient, getSanitizedRedisUrl } from "./redis.js"; // Import helper
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: CONFIG.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Enable Redis adapter for horizontal scaling in production
  // Check against sanitized URL to support both REDIS_URL and REDIS_HOST configs
  if (process.env.NODE_ENV === 'production' && getSanitizedRedisUrl()) {
    try {
      const pubClient = redisClient.getPublisher();
      const subClient = redisClient.getSubscriber();

      if (pubClient && subClient) {
        io.adapter(createAdapter(pubClient, subClient));
        logger.success('Socket.io Redis adapter enabled for horizontal scaling');
      }
    } catch (error) {
      logger.warning('Socket.io Redis adapter failed, using default adapter:', error.message);
    }
  }

  // ✅ JWT authentication middleware (single source of truth)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        logger.warning(`Socket auth failed: Missing token for socket ${socket.id}`);
        return next(new Error("Missing token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // decoded should contain: { id, userId, userName, isGuest, role, iat, exp }
      socket.user = decoded;

      logger.socket(`Socket authenticated: ${decoded.userName} (${decoded.userId})`);
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        logger.warning(`Socket auth failed: JWT expired for socket ${socket.id}`);
        return next(new Error("Token expired"));
      }
      logger.error("Socket auth error:", e.message);
      next(new Error("Invalid token"));
    }
  });

  return io;
}
