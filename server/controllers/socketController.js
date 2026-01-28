/**
 * Socket Controller - Database Integrated Version
 * 
 * Handles real-time WebSocket events with database persistence.
 * Uses activeRoomSessions for real-time state and syncs to DB periodically.
 */

import { rooms, users, activeRoomSessions, RoomController } from './roomController.js';
import { User } from '../models/User.js';
import { executeWithPiston } from '../services/pistonExecutor.js';
import { aiService } from '../services/aiService.js';
import { SOCKET_EVENTS, ERROR_MESSAGES, CONFIG } from '../config/constants.js';
import { validateCodeExecution } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

// Debounce timers for DB persistence
const persistenceTimers = new Map();
const PERSIST_DEBOUNCE_MS = 5000; // Persist code every 5 seconds of inactivity

export class SocketController {
  constructor(io) {
    this.io = io;

    // Bind all methods to this instance
    this.handleConnection = this.handleConnection.bind(this);
    this.handleJoinRoom = this.handleJoinRoom.bind(this);
    this.handleCodeUpdate = this.handleCodeUpdate.bind(this);
    this.handleExecuteCode = this.handleExecuteCode.bind(this);
    this.handleRequestHint = this.handleRequestHint.bind(this);
    this.handleCursorMove = this.handleCursorMove.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  handleConnection(socket) {
    logger.socket(`User connected: ${socket.id}`);

    // Join Room
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
      this.handleJoinRoom(socket, data);
    });

    // Code Update
    socket.on(SOCKET_EVENTS.CODE_UPDATE, (data) => {
      this.handleCodeUpdate(socket, data);
    });

    // Execute Code
    socket.on(SOCKET_EVENTS.EXECUTE_CODE, (data) => {
      this.handleExecuteCode(socket, data);
    });

    // Request Hint
    socket.on(SOCKET_EVENTS.REQUEST_HINT, (data) => {
      this.handleRequestHint(socket, data);
    });

    // Cursor Move
    socket.on(SOCKET_EVENTS.CURSOR_MOVE, (data) => {
      this.handleCursorMove(socket, data);
    });

    // Typing indicators
    socket.on('user-typing', (data) => {
      this.handleTyping(socket, data, true);
    });

    socket.on('user-stopped-typing', (data) => {
      this.handleTyping(socket, data, false);
    });

    // Disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  async handleJoinRoom(socket, data) {
    const { roomId } = data;

    // Identity comes from JWT (set in io.use middleware)
    const { id, userId, userName, isGuest } = socket.user || {};

    if (!roomId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "roomId is required" });
      return;
    }

    if (!id || !userName) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: "Unauthorized socket (missing user info)" });
      return;
    }

    try {
      // Load room from database if not in active sessions
      let room = activeRoomSessions.get(roomId);

      if (!room) {
        // Try to load from database
        room = await RoomController.loadRoomSession(roomId);

        if (!room) {
          // Room doesn't exist - create a new session (will be persisted later)
          room = {
            code: '// Welcome to CodeCollab!\n// Start coding here...\n',
            language: 'javascript',
            participants: [],
            recording: [],
            createdAt: new Date(),
          };
          activeRoomSessions.set(roomId, room);
          logger.room(`Created new room session: ${roomId}`);
        }
      }

      // Check room capacity
      if (room.participants && room.participants.length >= CONFIG.ROOM.MAX_PARTICIPANTS) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.ROOM_FULL });
        return;
      }

      // Initialize participants array if needed
      if (!room.participants) {
        room.participants = [];
      }

      // Add participant
      const participant = {
        id,
        userId,
        userName,
        isGuest: !!isGuest,
        socketId: socket.id,
        joinedAt: new Date(),
        cursorPosition: { line: 0, column: 0 },
      };

      room.participants.push(participant);
      socket.join(roomId);

      // Create user instance (track by socket.id)
      const user = new User(userId, userName, socket.id, roomId);
      users.set(socket.id, user);

      logger.room(`${userName} joined ${roomId} (${room.participants.length} users)`);

      // Notify all users
      this.io.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, {
        userId,
        userName,
        participants: room.participants.map((p) => ({
          userId: p.userId,
          userName: p.userName,
        })),
      });

      // Send current code to new user
      socket.emit(SOCKET_EVENTS.LOAD_CODE, {
        code: room.code || '',
        language: room.language || 'javascript',
      });

      // Add to recording
      if (!room.recording) room.recording = [];
      room.recording.push({
        type: 'user_joined',
        data: { userId, userName },
        timestamp: Date.now(),
      });

    } catch (error) {
      logger.error("Join room error:", error.message);
      socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    }
  }

  handleCodeUpdate(socket, data) {
    const { roomId, code } = data;
    const room = activeRoomSessions.get(roomId);
    const user = users.get(socket.id);

    if (!room || !user) {
      logger.warning('Code update failed: room or user not found');
      return;
    }

    // Update room code in memory
    room.code = code;

    // Broadcast to others (not sender)
    socket.to(roomId).emit(SOCKET_EVENTS.CODE_UPDATE, {
      code,
      userId: user.userId,
    });

    // Debounced persistence to database
    this.schedulePersistence(roomId, room);

    // Add to recording (throttled)
    if (!room._lastRecordTime || Date.now() - room._lastRecordTime > 5000) {
      if (!room.recording) room.recording = [];
      room.recording.push({
        type: 'code_update',
        data: { userId: user.userId },
        timestamp: Date.now(),
      });
      room._lastRecordTime = Date.now();
    }
  }

  /**
   * Debounced persistence to reduce DB writes
   */
  schedulePersistence(roomId, room) {
    // Clear existing timer
    if (persistenceTimers.has(roomId)) {
      clearTimeout(persistenceTimers.get(roomId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      RoomController.persistRoomCode(roomId, room.code, room.language);
      persistenceTimers.delete(roomId);
    }, PERSIST_DEBOUNCE_MS);

    persistenceTimers.set(roomId, timer);
  }

  async handleExecuteCode(socket, data) {
    const { roomId, code, language } = data;
    const room = activeRoomSessions.get(roomId);
    const user = users.get(socket.id);

    if (!room || !user) {
      logger.warning('Execute failed: room or user not found');
      return;
    }

    try {
      // Validate input
      validateCodeExecution({ code, language });

      logger.info(`Executing ${language} code for ${user.userName} in ${roomId}`);

      // Execute code
      const result = await executeWithPiston({ code, language });

      logger.info(`Execution completed in ${result.duration}ms`);

      // Send result to all participants
      this.io.to(roomId).emit(SOCKET_EVENTS.EXECUTION_RESULT, {
        stdout: result.output,
        stderr: result.error,
        time_ms: result.duration,
        executedBy: user.userName,
      });

      // Track execution
      if (!room.recording) room.recording = [];
      room.recording.push({
        type: 'execution',
        data: { userId: user.userId, language, success: !result.error },
        timestamp: Date.now(),
      });

    } catch (error) {
      logger.error('Code execution error:', error.message);
      socket.emit(SOCKET_EVENTS.EXECUTION_ERROR, {
        error: error.message,
      });
    }
  }

  async handleRequestHint(socket, data) {
    const { roomId, problemId } = data;
    const room = activeRoomSessions.get(roomId);
    const user = users.get(socket.id);

    if (!room || !user) {
      logger.warning('Hint request failed: room or user not found');
      return;
    }

    try {
      const hintData = await aiService.generateHint(
        room.code,
        problemId,
        user.userId,
        room
      );

      socket.emit(SOCKET_EVENTS.HINT_RESPONSE, {
        hint: hintData.hint,
        type: hintData.type,
      });

      logger.info(`Hint provided to ${user.userName}`);

      // Track hint usage
      if (hintData.type !== 'cooldown') {
        if (!room.recording) room.recording = [];
        room.recording.push({
          type: 'hint_request',
          data: { userId: user.userId },
          timestamp: Date.now(),
        });
      }

    } catch (error) {
      logger.error('Hint generation error:', error.message);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: 'Failed to generate hint',
      });
    }
  }

  handleCursorMove(socket, data) {
    const { roomId, position } = data;
    const user = users.get(socket.id);
    const room = activeRoomSessions.get(roomId);

    if (!room || !user) return;

    // Update cursor position
    const participant = room.participants?.find(p => p.socketId === socket.id);
    if (participant) {
      participant.cursorPosition = position;
    }

    // Broadcast to others
    socket.to(roomId).emit('cursor_update', {
      userId: user.userId,
      userName: user.userName,
      position,
    });
  }

  handleTyping(socket, data, isTyping) {
    const { roomId } = data;
    const user = users.get(socket.id);

    if (!user || !roomId) return;

    const event = isTyping ? 'user-typing' : 'user-stopped-typing';
    socket.to(roomId).emit(event, {
      userId: user.userId,
      userName: user.userName,
    });
  }

  async handleDisconnect(socket) {
    const user = users.get(socket.id);

    if (user) {
      const room = activeRoomSessions.get(user.roomId);

      if (room) {
        // Remove participant
        if (room.participants) {
          room.participants = room.participants.filter(p => p.socketId !== socket.id);
        }

        logger.room(`${user.userName} left ${user.roomId} (${room.participants?.length || 0} remaining)`);

        // Notify others
        this.io.to(user.roomId).emit(SOCKET_EVENTS.USER_LEFT, {
          userId: user.userId,
          userName: user.userName,
          participants: (room.participants || []).map(p => ({
            userId: p.userId,
            userName: p.userName,
          })),
        });

        // Add to recording
        if (!room.recording) room.recording = [];
        room.recording.push({
          type: 'user_left',
          data: { userId: user.userId, userName: user.userName },
          timestamp: Date.now(),
        });

        // Persist final state before potentially cleaning up
        await RoomController.persistRoomCode(user.roomId, room.code, room.language);

        // Cleanup empty rooms after delay
        if (!room.participants || room.participants.length === 0) {
          setTimeout(() => {
            const currentRoom = activeRoomSessions.get(user.roomId);
            if (currentRoom && (!currentRoom.participants || currentRoom.participants.length === 0)) {
              activeRoomSessions.delete(user.roomId);
              logger.room(`Cleaned up empty room: ${user.roomId}`);
            }
          }, 60000); // Wait 1 minute before cleanup
        }
      }
    }

    users.delete(socket.id);
    logger.socket(`User disconnected: ${socket.id}`);
  }
}
