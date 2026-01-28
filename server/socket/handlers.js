import authService from '../services/authService.js';
import roomService from '../services/roomService.js';
import codeExecutor from '../services/codeExecutor.js';
import aiService from '../services/aiService.js';
import sessionService from '../services/sessionService.js';
import { SOCKET_EVENTS, ERROR_MESSAGES } from '../config/constants.js';
import logger from '../utils/logger.js';
import { latencyStats } from '../routes/metricsRoutes.js';

// In-memory session tracking
const roomSessions = new Map();

// Track pending code updates for latency measurement
const pendingUpdates = new Map();

export function setupSocketHandlers(io) {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error(ERROR_MESSAGES.AUTHENTICATION_REQUIRED));
      }

      const decoded = authService.verifyToken(token);
      socket.userId = decoded.userId;
      socket.userName = decoded.userName;

      await authService.updateLastSeen(decoded.userId);
      next();
    } catch (err) {
      logger.error('Socket auth error:', err.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`✅ Connected: ${socket.userName} (${socket.id})`);

    // JOIN ROOM
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (roomId) => {
      try {
        socket.join(roomId);
        socket.currentRoom = roomId;

        const participants = await roomService.addParticipant(roomId, {
          userId: socket.userId,
          userName: socket.userName,
          socketId: socket.id
        });

        const room = await roomService.getRoom(roomId);

        // Send current code to joining user
        socket.emit(SOCKET_EVENTS.LOAD_CODE, { code: room.code });

        // Notify all users
        io.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, { participants });

        // Initialize session if doesn't exist
        if (!roomSessions.has(roomId)) {
          const session = await sessionService.createSession({
            roomId: room.id,
            candidateId: socket.userId,
            language: room.language
          });

          roomSessions.set(roomId, {
            sessionId: session.id,
            startTime: Date.now(),
            codeHistory: [],
            executionAttempts: 0,
            successfulExecutions: 0,
            hintsUsed: 0,
            errorsFixed: 0
          });

          logger.info(`📝 Session created: ${session.id}`);
        }

        logger.info(`👤 ${socket.userName} joined ${roomId}`);
      } catch (err) {
        logger.error('Join room error:', err.message);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: err.message || ERROR_MESSAGES.ROOM_NOT_FOUND
        });
      }
    });

    // CODE UPDATE - with latency tracking for resume validation
    socket.on(SOCKET_EVENTS.CODE_UPDATE, async (data) => {
      const startTime = performance.now();

      try {
        const { roomId, code, clientTimestamp } = data;

        await roomService.updateCode(roomId, code);

        // Track code history for personality analysis
        if (roomSessions.has(roomId)) {
          const sessionData = roomSessions.get(roomId);
          sessionData.codeHistory.push(code);
          roomSessions.set(roomId, sessionData);
        }

        // Calculate and track latency
        const serverProcessingTime = performance.now() - startTime;

        // If client sent timestamp, calculate full round-trip
        if (clientTimestamp) {
          const fullLatency = Date.now() - clientTimestamp;
          latencyStats.addSample(fullLatency);
          logger.debug(`Code sync latency: ${fullLatency}ms (server: ${serverProcessingTime.toFixed(2)}ms)`);
        } else {
          // Just track server-side processing time  
          latencyStats.addSample(serverProcessingTime);
        }

        // Broadcast to others (not sender) with server timestamp for latency measurement
        socket.to(roomId).emit(SOCKET_EVENTS.CODE_UPDATE, {
          code,
          serverTimestamp: Date.now(),
        });
      } catch (err) {
        logger.error('Code update error:', err.message);
      }
    });

    // EXECUTE CODE
    socket.on(SOCKET_EVENTS.EXECUTE_CODE, async (data) => {
      try {
        const { roomId, code, language } = data;

        logger.info(`🚀 Executing ${language} code in ${roomId}`);

        // Track execution attempt
        if (roomSessions.has(roomId)) {
          const sessionData = roomSessions.get(roomId);
          sessionData.executionAttempts++;
          roomSessions.set(roomId, sessionData);
        }

        // Execute code
        const result = await codeExecutor.execute(code, language);

        // Track successful execution
        if (result.success && roomSessions.has(roomId)) {
          const sessionData = roomSessions.get(roomId);
          sessionData.successfulExecutions++;
          roomSessions.set(roomId, sessionData);
        }

        // Broadcast result to all in room
        io.to(roomId).emit(SOCKET_EVENTS.EXECUTION_RESULT, {
          stdout: result.stdout,
          stderr: result.stderr,
          success: result.success,
          executionTime: result.executionTime,
          memory: result.memory
        });

        logger.info(`✅ Execution ${result.success ? 'SUCCESS' : 'FAILED'} in ${roomId}`);
      } catch (err) {
        logger.error('Execute code error:', err.message);
        io.to(data.roomId).emit(SOCKET_EVENTS.EXECUTION_ERROR, {
          message: err.message || ERROR_MESSAGES.EXECUTION_TIMEOUT
        });
      }
    });

    // REQUEST AI FEEDBACK
    socket.on(SOCKET_EVENTS.REQUEST_AI_FEEDBACK, async (data) => {
      try {
        const { roomId, code, language } = data;

        logger.info(`🤖 AI analyzing ${language} code in ${roomId}`);

        const feedback = await aiService.analyzeCode(code, language);

        // Broadcast to all in room
        io.to(roomId).emit(SOCKET_EVENTS.AI_FEEDBACK_RESPONSE, { feedback });

        logger.info(`✅ AI feedback sent: ${feedback.length} items`);
      } catch (err) {
        logger.error('AI feedback error:', err.message);
        socket.emit(SOCKET_EVENTS.AI_FEEDBACK_RESPONSE, {
          feedback: [{
            severity: 'info',
            message: ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE,
            suggestion: 'Keep coding!',
            explanation: 'The AI service is temporarily processing other requests.'
          }]
        });
      }
    });

    // REQUEST HINT
    socket.on(SOCKET_EVENTS.REQUEST_HINT, async (data) => {
      try {
        const { roomId, problemId, code, language } = data;

        // Track hint usage
        if (roomSessions.has(roomId)) {
          const sessionData = roomSessions.get(roomId);
          sessionData.hintsUsed++;
          roomSessions.set(roomId, sessionData);
        }

        logger.info(`💡 Generating hint for ${roomId}`);

        const hint = await aiService.generateHint(
          code,
          problemId || 'General problem',
          language
        );

        socket.emit(SOCKET_EVENTS.HINT_RESPONSE, { hint });

        logger.info(`✅ Hint sent to ${socket.userName}`);
      } catch (err) {
        logger.error('Hint error:', err.message);
        socket.emit(SOCKET_EVENTS.HINT_RESPONSE, {
          hint: 'Try breaking the problem into smaller, manageable steps.'
        });
      }
    });

    // GET PERSONALITY SCORE
    socket.on(SOCKET_EVENTS.GET_PERSONALITY_SCORE, async (data) => {
      try {
        const { roomId } = data;

        if (!roomSessions.has(roomId)) {
          socket.emit(SOCKET_EVENTS.PERSONALITY_SCORE, { score: null });
          return;
        }

        const sessionData = roomSessions.get(roomId);
        const timeSpent = Math.floor((Date.now() - sessionData.startTime) / 1000);

        const score = await aiService.calculatePersonalityScore({
          ...sessionData,
          timeSpent
        });

        socket.emit(SOCKET_EVENTS.PERSONALITY_SCORE, { score });

        logger.info(`📊 Personality score: ${score.overall}/10 for ${roomId}`);
      } catch (err) {
        logger.error('Get personality score error:', err.message);
        socket.emit(SOCKET_EVENTS.PERSONALITY_SCORE, { score: null });
      }
    });

    // END SESSION & GENERATE REPORT
    socket.on(SOCKET_EVENTS.END_SESSION, async (data) => {
      try {
        const { roomId } = data;

        if (!roomSessions.has(roomId)) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: ERROR_MESSAGES.SESSION_NOT_FOUND
          });
          return;
        }

        const sessionData = roomSessions.get(roomId);
        const timeSpent = Math.floor((Date.now() - sessionData.startTime) / 1000);

        logger.info(`📋 Ending session: ${sessionData.sessionId}`);

        // End session in database
        await sessionService.endSession(sessionData.sessionId);

        // Generate assessment report
        const report = await sessionService.generateAssessmentReport(
          sessionData.sessionId,
          {
            ...sessionData,
            timeSpent
          }
        );

        // Send report to all users in room
        io.to(roomId).emit(SOCKET_EVENTS.ASSESSMENT_REPORT, {
          report: {
            ...report,
            sessionMetrics: {
              timeSpent,
              executionAttempts: sessionData.executionAttempts,
              successfulExecutions: sessionData.successfulExecutions,
              hintsUsed: sessionData.hintsUsed
            }
          }
        });

        // Cleanup session data
        roomSessions.delete(roomId);

        logger.info(`✅ Assessment report generated for ${sessionData.sessionId}`);
      } catch (err) {
        logger.error('End session error:', err.message);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Failed to generate assessment report'
        });
      }
    });

    // LEAVE ROOM
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, async (roomId) => {
      try {
        socket.leave(roomId);

        const participants = await roomService.removeParticipant(
          roomId,
          socket.userId
        );

        io.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, { participants });

        logger.info(`👋 ${socket.userName} left ${roomId}`);
      } catch (err) {
        logger.error('Leave room error:', err.message);
      }
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      logger.info(`❌ Disconnected: ${socket.userName} (${socket.id})`);

      if (socket.currentRoom) {
        try {
          const participants = await roomService.removeParticipant(
            socket.currentRoom,
            socket.userId
          );

          io.to(socket.currentRoom).emit(SOCKET_EVENTS.USER_LEFT, {
            participants
          });
        } catch (err) {
          logger.error('Disconnect cleanup error:', err.message);
        }
      }
    });
  });
}
