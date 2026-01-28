/**
 * Room Controller - Database Persistent Version
 * 
 * Uses Prisma for persistent storage instead of in-memory Map.
 * Rooms now survive server restarts.
 */

import prisma from '../config/database.js';
import { generateRoomId } from '../utils/helpers.js';
import { CONFIG, ERROR_MESSAGES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// Keep users in-memory (they're transient socket connections)
export const users = new Map();

// In-memory cache for active room sessions (for real-time state)
// This holds live participants and real-time code changes
export const activeRoomSessions = new Map();

export class RoomController {
  /**
   * Create a new room and persist to database
   */
  async createRoom(req, res) {
    try {
      const roomId = generateRoomId();
      const hostId = req.user?.id;

      if (!hostId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required to create a room',
        });
      }

      // Create room in database
      const room = await prisma.room.create({
        data: {
          roomId,
          createdBy: hostId,
          code: '// Welcome to CodeCollab!\n// Start coding here...\n',
          language: 'javascript',
          participants: [],
        },
      });

      logger.room(`Created room: ${roomId} (Host: ${hostId})`);

      res.status(201).json({
        success: true,
        data: {
          roomId: room.roomId,
          shareLink: `${CONFIG.CLIENT_URL}/room/${roomId}`,
          createdAt: room.createdAt,
        },
      });
    } catch (error) {
      logger.error('Create room error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to create room',
      });
    }
  }

  /**
   * Get room details from database
   */
  async getRoom(req, res) {
    try {
      const { roomId } = req.params;

      // First check in-memory session for real-time data
      const activeSession = activeRoomSessions.get(roomId);

      // Query database
      const room = await prisma.room.findUnique({
        where: { roomId },
        include: {
          creator: {
            select: { userName: true, userId: true },
          },
        },
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: { message: ERROR_MESSAGES.ROOM_NOT_FOUND },
        });
      }

      // Merge with active session data if available
      const responseData = {
        id: room.roomId,
        roomId: room.roomId,
        code: activeSession?.code ?? room.code,
        language: activeSession?.language ?? room.language,
        participants: activeSession?.participants ?? room.participants,
        createdAt: room.createdAt,
        createdBy: room.creator?.userName || 'Unknown',
        isActive: !!activeSession,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      logger.error('Get room error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve room',
      });
    }
  }

  /**
   * Delete room from database
   */
  async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;

      // Check if room exists
      const room = await prisma.room.findUnique({
        where: { roomId },
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: { message: ERROR_MESSAGES.ROOM_NOT_FOUND },
        });
      }

      // Optional: Check ownership (only creator can delete)
      if (req.user?.id !== room.createdBy) {
        return res.status(403).json({
          success: false,
          error: 'Only the room creator can delete this room',
        });
      }

      // Delete from database
      await prisma.room.delete({
        where: { roomId },
      });

      // Remove from active sessions
      activeRoomSessions.delete(roomId);

      logger.room(`Deleted room: ${roomId}`);

      res.json({
        success: true,
        message: 'Room deleted successfully',
      });
    } catch (error) {
      logger.error('Delete room error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to delete room',
      });
    }
  }

  /**
   * Get all active rooms
   */
  async getActiveRooms(req, res) {
    try {
      // Get rooms from database (last 24 hours or with active sessions)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const rooms = await prisma.room.findMany({
        where: {
          createdAt: { gte: oneDayAgo },
        },
        select: {
          roomId: true,
          language: true,
          createdAt: true,
          creator: {
            select: { userName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit for performance
      });

      // Enrich with active participant count
      const enrichedRooms = rooms.map(room => ({
        roomId: room.roomId,
        language: room.language,
        createdAt: room.createdAt,
        createdBy: room.creator?.userName || 'Unknown',
        participantCount: activeRoomSessions.get(room.roomId)?.participants?.length || 0,
        isActive: activeRoomSessions.has(room.roomId),
      }));

      res.json({
        success: true,
        data: {
          rooms: enrichedRooms,
          totalRooms: rooms.length,
          totalActiveUsers: users.size,
        },
      });
    } catch (error) {
      logger.error('Get active rooms error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve rooms',
      });
    }
  }

  /**
   * Get room recording (placeholder - recordings stored separately)
   */
  async getRecording(req, res) {
    try {
      const { roomId } = req.params;

      const room = await prisma.room.findUnique({
        where: { roomId },
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: { message: ERROR_MESSAGES.ROOM_NOT_FOUND },
        });
      }

      // Get active session recording if available
      const session = activeRoomSessions.get(roomId);

      res.json({
        success: true,
        data: {
          roomId,
          events: session?.recording || [],
          eventCount: session?.recording?.length || 0,
        },
      });
    } catch (error) {
      logger.error('Get recording error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recording',
      });
    }
  }

  /**
   * Update room code in database (called periodically from socket handler)
   */
  static async persistRoomCode(roomId, code, language) {
    try {
      await prisma.room.update({
        where: { roomId },
        data: { code, language, updatedAt: new Date() },
      });
      logger.info(`Persisted code for room: ${roomId}`);
    } catch (error) {
      logger.error(`Failed to persist code for room ${roomId}:`, error.message);
    }
  }

  /**
   * Load room from database into active session
   */
  static async loadRoomSession(roomId) {
    try {
      const room = await prisma.room.findUnique({
        where: { roomId },
      });

      if (room) {
        activeRoomSessions.set(roomId, {
          code: room.code,
          language: room.language,
          participants: [],
          recording: [],
          createdAt: room.createdAt,
        });
        return activeRoomSessions.get(roomId);
      }
      return null;
    } catch (error) {
      logger.error(`Failed to load room session ${roomId}:`, error.message);
      return null;
    }
  }
}

export const roomController = new RoomController();

// Legacy export for backward compatibility with socket controller
export const rooms = activeRoomSessions;
