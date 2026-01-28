/**
 * Session Analytics Service
 * 
 * Tracks and analyzes coding interview sessions:
 * - Time spent
 * - Code changes
 * - Hint usage
 * - Execution attempts
 * - Performance metrics
 */

import { logger } from '../utils/logger.js';
import { cache, roomCache } from '../config/redis.js';

class SessionAnalyticsService {
    constructor() {
        this.eventBuffer = new Map();
        this.flushInterval = 30000; // Flush to DB every 30 seconds

        // Start periodic flush
        setInterval(() => this.flushEvents(), this.flushInterval);
    }

    /**
     * Track session start
     */
    async startSession(roomId, userId, userName) {
        const sessionId = `session:${roomId}:${userId}`;
        const startTime = Date.now();

        const sessionData = {
            sessionId,
            roomId,
            userId,
            userName,
            startTime,
            events: [],
            metrics: {
                codeChanges: 0,
                executions: 0,
                successfulExecutions: 0,
                hintsUsed: 0,
                errors: 0,
                linesOfCode: 0,
            },
        };

        await cache.set(sessionId, sessionData, 86400); // 24 hour TTL
        logger.info(`Session started: ${sessionId}`);

        return sessionData;
    }

    /**
     * Track event
     */
    async trackEvent(roomId, userId, eventType, data = {}) {
        const sessionId = `session:${roomId}:${userId}`;

        const event = {
            type: eventType,
            timestamp: Date.now(),
            data,
        };

        // Buffer events for batch processing
        if (!this.eventBuffer.has(sessionId)) {
            this.eventBuffer.set(sessionId, []);
        }
        this.eventBuffer.get(sessionId).push(event);

        // Update metrics in cache
        await this.updateMetrics(sessionId, eventType, data);

        return event;
    }

    /**
     * Update session metrics
     */
    async updateMetrics(sessionId, eventType, data) {
        const session = await cache.get(sessionId);
        if (!session) return;

        switch (eventType) {
            case 'code_change':
                session.metrics.codeChanges++;
                session.metrics.linesOfCode = data.lineCount || session.metrics.linesOfCode;
                break;
            case 'execution':
                session.metrics.executions++;
                if (data.success) {
                    session.metrics.successfulExecutions++;
                }
                break;
            case 'hint_request':
                session.metrics.hintsUsed++;
                break;
            case 'error':
                session.metrics.errors++;
                break;
        }

        await cache.set(sessionId, session, 86400);
    }

    /**
     * End session and calculate final stats
     */
    async endSession(roomId, userId) {
        const sessionId = `session:${roomId}:${userId}`;
        const session = await cache.get(sessionId);

        if (!session) {
            return null;
        }

        const endTime = Date.now();
        const duration = endTime - session.startTime;

        const finalStats = {
            ...session,
            endTime,
            duration,
            durationMinutes: Math.round(duration / 60000),
            metrics: {
                ...session.metrics,
                executionSuccessRate: session.metrics.executions > 0
                    ? Math.round((session.metrics.successfulExecutions / session.metrics.executions) * 100)
                    : 0,
                codeChangesPerMinute: duration > 60000
                    ? Math.round(session.metrics.codeChanges / (duration / 60000))
                    : session.metrics.codeChanges,
            },
        };

        // Store final session in cache for later analysis
        await cache.set(`completed:${sessionId}`, finalStats, 604800); // 7 days

        // Flush remaining events
        await this.flushEvents(sessionId);

        logger.info(`Session ended: ${sessionId}, Duration: ${finalStats.durationMinutes}min`);

        return finalStats;
    }

    /**
     * Get live session stats
     */
    async getSessionStats(roomId, userId) {
        const sessionId = `session:${roomId}:${userId}`;
        const session = await cache.get(sessionId);

        if (!session) {
            return null;
        }

        const currentTime = Date.now();
        const duration = currentTime - session.startTime;

        return {
            sessionId,
            durationSeconds: Math.round(duration / 1000),
            durationMinutes: Math.round(duration / 60000),
            metrics: session.metrics,
            isActive: true,
        };
    }

    /**
     * Get room aggregate stats
     */
    async getRoomStats(roomId) {
        const room = await roomCache.getRoom(roomId);

        const stats = {
            roomId,
            participantCount: room?.participants?.length || 0,
            totalExecutions: 0,
            totalHints: 0,
            averageSessionDuration: 0,
        };

        // Aggregate from participants' sessions
        if (room?.participants) {
            for (const participant of room.participants) {
                const sessionStats = await this.getSessionStats(roomId, participant.userId);
                if (sessionStats) {
                    stats.totalExecutions += sessionStats.metrics.executions || 0;
                    stats.totalHints += sessionStats.metrics.hintsUsed || 0;
                }
            }
        }

        return stats;
    }

    /**
     * Generate interview report
     */
    async generateReport(roomId, userId) {
        const sessionId = `session:${roomId}:${userId}`;
        const session = await cache.get(sessionId) || await cache.get(`completed:${sessionId}`);

        if (!session) {
            return { error: 'Session not found' };
        }

        const report = {
            overview: {
                candidate: session.userName,
                duration: Math.round((session.endTime || Date.now()) - session.startTime) / 60000,
                completedAt: session.endTime ? new Date(session.endTime).toISOString() : null,
            },
            performance: {
                codeChanges: session.metrics.codeChanges,
                totalExecutions: session.metrics.executions,
                successfulExecutions: session.metrics.successfulExecutions,
                successRate: session.metrics.executions > 0
                    ? `${Math.round((session.metrics.successfulExecutions / session.metrics.executions) * 100)}%`
                    : 'N/A',
                hintsUsed: session.metrics.hintsUsed,
                errors: session.metrics.errors,
            },
            analysis: this.analyzePerformance(session.metrics),
            timeline: await this.getEventTimeline(sessionId),
        };

        return report;
    }

    /**
     * Analyze performance
     */
    analyzePerformance(metrics) {
        const analysis = {
            strengths: [],
            areasToImprove: [],
            overallScore: 0,
        };

        // Execution success
        const successRate = metrics.executions > 0
            ? (metrics.successfulExecutions / metrics.executions) * 100
            : 0;

        if (successRate >= 80) {
            analysis.strengths.push('High code execution success rate');
            analysis.overallScore += 25;
        } else if (successRate < 50) {
            analysis.areasToImprove.push('Work on reducing syntax errors');
        }

        // Hint usage
        if (metrics.hintsUsed <= 2) {
            analysis.strengths.push('Independent problem solving');
            analysis.overallScore += 25;
        } else if (metrics.hintsUsed > 5) {
            analysis.areasToImprove.push('Practice similar problems to reduce hint dependency');
        }

        // Activity level
        if (metrics.codeChanges > 10) {
            analysis.strengths.push('Active coding and iteration');
            analysis.overallScore += 25;
        }

        // Error handling
        if (metrics.errors < metrics.executions * 0.2) {
            analysis.strengths.push('Good error awareness');
            analysis.overallScore += 25;
        }

        return analysis;
    }

    /**
     * Get event timeline for session
     */
    async getEventTimeline(sessionId) {
        const events = this.eventBuffer.get(sessionId) || [];
        return events.slice(-50).map(e => ({
            type: e.type,
            time: new Date(e.timestamp).toISOString(),
        }));
    }

    /**
     * Flush buffered events to storage
     */
    async flushEvents(specificSessionId = null) {
        const sessionsToFlush = specificSessionId
            ? [[specificSessionId, this.eventBuffer.get(specificSessionId) || []]]
            : Array.from(this.eventBuffer.entries());

        for (const [sessionId, events] of sessionsToFlush) {
            if (events.length === 0) continue;

            try {
                const session = await cache.get(sessionId);
                if (session) {
                    session.events = [...(session.events || []), ...events].slice(-500);
                    await cache.set(sessionId, session, 86400);
                }

                if (specificSessionId) {
                    this.eventBuffer.delete(sessionId);
                } else {
                    this.eventBuffer.set(sessionId, []);
                }
            } catch (error) {
                logger.error(`Failed to flush events for ${sessionId}:`, error.message);
            }
        }
    }
}

export const analyticsService = new SessionAnalyticsService();
export default analyticsService;
