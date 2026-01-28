import express from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/analytics/session/start
 * @desc    Start tracking a coding session
 * @access  Authenticated
 */
router.post('/session/start', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: 'Room ID is required',
            });
        }

        const session = await analyticsService.startSession(
            roomId,
            req.user.userId,
            req.user.userName
        );

        res.json({
            success: true,
            data: {
                sessionId: session.sessionId,
                startTime: session.startTime,
            },
        });

    } catch (error) {
        logger.error('Start session error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to start session' });
    }
});

/**
 * @route   POST /api/analytics/session/end
 * @desc    End a coding session and get final stats
 * @access  Authenticated
 */
router.post('/session/end', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: 'Room ID is required',
            });
        }

        const stats = await analyticsService.endSession(roomId, req.user.userId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
            });
        }

        res.json({
            success: true,
            data: stats,
        });

    } catch (error) {
        logger.error('End session error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to end session' });
    }
});

/**
 * @route   GET /api/analytics/session/:roomId
 * @desc    Get live session stats
 * @access  Authenticated
 */
router.get('/session/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;

        const stats = await analyticsService.getSessionStats(roomId, req.user.userId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                error: 'Session not found',
            });
        }

        res.json({
            success: true,
            data: stats,
        });

    } catch (error) {
        logger.error('Get session stats error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get session stats' });
    }
});

/**
 * @route   GET /api/analytics/room/:roomId
 * @desc    Get room aggregate stats
 * @access  Authenticated
 */
router.get('/room/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;

        const stats = await analyticsService.getRoomStats(roomId);

        res.json({
            success: true,
            data: stats,
        });

    } catch (error) {
        logger.error('Get room stats error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get room stats' });
    }
});

/**
 * @route   GET /api/analytics/report/:roomId
 * @desc    Generate interview report
 * @access  Authenticated
 */
router.get('/report/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;

        const report = await analyticsService.generateReport(roomId, req.user.userId);

        if (report.error) {
            return res.status(404).json({
                success: false,
                error: report.error,
            });
        }

        res.json({
            success: true,
            data: report,
        });

    } catch (error) {
        logger.error('Generate report error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate report' });
    }
});

/**
 * @route   POST /api/analytics/event
 * @desc    Track custom event
 * @access  Authenticated
 */
router.post('/event', authenticateToken, async (req, res) => {
    try {
        const { roomId, eventType, data } = req.body;

        if (!roomId || !eventType) {
            return res.status(400).json({
                success: false,
                error: 'Room ID and event type are required',
            });
        }

        const event = await analyticsService.trackEvent(
            roomId,
            req.user.userId,
            eventType,
            data || {}
        );

        res.json({
            success: true,
            data: event,
        });

    } catch (error) {
        logger.error('Track event error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to track event' });
    }
});

export default router;
