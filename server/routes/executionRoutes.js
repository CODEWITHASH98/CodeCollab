import express from 'express';
import { executeWithPiston, getSupportedLanguages, isLanguageSupported, getAvailableRuntimes } from '../services/pistonExecutor.js';
import { addExecutionJob, getJobStatus, getQueueStats } from '../queues/executionQueue.js';
import { aiService } from '../services/aiService.js';
import { analyticsService } from '../services/analyticsService.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/execute/languages
 * @desc    Get all supported programming languages (40+)
 * @access  Public
 */
router.get('/languages', async (req, res) => {
    try {
        const languages = getSupportedLanguages();

        res.json({
            success: true,
            data: {
                count: languages.length,
                languages,
            },
        });
    } catch (error) {
        logger.error('Get languages error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get languages',
        });
    }
});

/**
 * @route   GET /api/execute/runtimes
 * @desc    Get available Piston runtimes with versions
 * @access  Public
 */
router.get('/runtimes', async (req, res) => {
    try {
        const runtimes = await getAvailableRuntimes();

        res.json({
            success: true,
            data: {
                count: runtimes.length,
                runtimes,
            },
        });
    } catch (error) {
        logger.error('Get runtimes error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get runtimes',
        });
    }
});

/**
 * @route   POST /api/execute
 * @desc    Execute code using Piston (synchronous)
 * @access  Authenticated
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { code, language, stdin = '', roomId } = req.body;

        // Validation
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Code is required',
            });
        }

        if (!language) {
            return res.status(400).json({
                success: false,
                error: 'Language is required',
            });
        }

        if (!isLanguageSupported(language)) {
            return res.status(400).json({
                success: false,
                error: `Language '${language}' is not supported`,
                supportedLanguages: getSupportedLanguages(),
            });
        }

        logger.info(`Executing ${language} code for ${req.user.userName}`);

        // Track analytics
        if (roomId) {
            await analyticsService.trackEvent(roomId, req.user.userId, 'execution', {
                language,
                codeLength: code.length,
            });
        }

        // Execute with Piston
        const result = await executeWithPiston({
            code,
            language,
            stdin,
        });

        // Track success/failure
        if (roomId) {
            await analyticsService.updateMetrics(
                `session:${roomId}:${req.user.userId}`,
                'execution',
                { success: result.success }
            );
        }

        res.json({
            success: true,
            data: {
                output: result.output,
                error: result.error || null,
                exitCode: result.exitCode,
                duration: result.duration,
                language,
                engine: result.engine,
            },
        });

    } catch (error) {
        logger.error('Execution error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Code execution failed',
            message: error.message,
        });
    }
});

/**
 * @route   POST /api/execute/async
 * @desc    Submit code for async execution (queue-based)
 * @access  Authenticated
 */
router.post('/async', authenticateToken, async (req, res) => {
    try {
        const { code, language, stdin = '', roomId } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Code and language are required',
            });
        }

        if (!isLanguageSupported(language)) {
            return res.status(400).json({
                success: false,
                error: `Language '${language}' is not supported`,
            });
        }

        // Add to queue
        const job = await addExecutionJob({
            code,
            language,
            stdin,
            roomId,
            userId: req.user.userId,
            userName: req.user.userName,
        });

        res.status(202).json({
            success: true,
            message: 'Code execution queued',
            data: {
                jobId: job.jobId,
                status: job.status,
            },
        });

    } catch (error) {
        logger.error('Async execution error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to queue execution',
        });
    }
});

/**
 * @route   GET /api/execute/job/:jobId
 * @desc    Get async job status
 * @access  Authenticated
 */
router.get('/job/:jobId', authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await getJobStatus(jobId);

        if (status.status === 'not_found') {
            return res.status(404).json({
                success: false,
                error: 'Job not found',
            });
        }

        res.json({
            success: true,
            data: status,
        });

    } catch (error) {
        logger.error('Get job status error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get job status' });
    }
});

/**
 * @route   GET /api/execute/queue/stats
 * @desc    Get execution queue statistics
 * @access  Authenticated
 */
router.get('/queue/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await getQueueStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error('Queue stats error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to get queue stats' });
    }
});

/**
 * @route   POST /api/execute/hint
 * @desc    Get AI coding hint (without giving solution)
 * @access  Authenticated
 */
router.post('/hint', authenticateToken, async (req, res) => {
    try {
        const { code, language, problemId } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Code is required',
            });
        }

        const result = await aiService.generateHint(code, problemId, req.user.userId, null);

        res.json({
            success: true,
            data: result,
        });

    } catch (error) {
        logger.error('Hint generation error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate hint' });
    }
});

/**
 * @route   POST /api/execute/review
 * @desc    Get AI code review
 * @access  Authenticated
 */
router.post('/review', authenticateToken, async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Code and language are required',
            });
        }

        const review = await aiService.reviewCode(code, language, req.user.userId);

        res.json({
            success: true,
            data: review,
        });

    } catch (error) {
        logger.error('Code review error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate review' });
    }
});

/**
 * @route   POST /api/execute/explain
 * @desc    Get AI code explanation
 * @access  Authenticated
 */
router.post('/explain', authenticateToken, async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Code and language are required',
            });
        }

        const result = await aiService.explainCode(code, language, req.user.userId);

        res.json({
            success: true,
            data: result,
        });

    } catch (error) {
        logger.error('Code explanation error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate explanation' });
    }
});

/**
 * @route   GET /api/execute/ai/status
 * @desc    Get AI service status
 * @access  Public
 */
router.get('/ai/status', (req, res) => {
    const status = aiService.getStatus();
    res.json({ success: true, data: status });
});

export default router;
