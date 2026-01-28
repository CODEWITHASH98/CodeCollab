import { Worker } from 'bullmq';
import { executeCode } from '../services/codeExecutor.js';
import { logger } from '../utils/logger.js';
import { io } from '../app.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import Redis from 'ioredis';
import { getSanitizedRedisUrl } from '../config/redis.js';

// Worker configuration
const WORKER_OPTIONS = {
    connection: new Redis(getSanitizedRedisUrl(), {
        maxRetriesPerRequest: null, // REQUIRED for BullMQ
        enableReadyCheck: false,
    }),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
};

/**
 * Code Execution Worker
 * Processes code execution jobs from the queue
 */
export class ExecutionWorker {
    constructor() {
        this.worker = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            logger.warning('Execution worker already running');
            return;
        }

        this.worker = new Worker(
            'code-execution',
            async (job) => {
                logger.info(`Processing job ${job.id}: ${job.data.language}`);

                try {
                    // Update progress
                    await job.updateProgress(10);

                    // Execute the code
                    const result = await executeCode(job);

                    // Update progress
                    await job.updateProgress(100);

                    // Broadcast result to room if roomId provided
                    if (job.data.roomId && io) {
                        io.to(job.data.roomId).emit(SOCKET_EVENTS.EXECUTION_RESULT, {
                            jobId: job.id,
                            stdout: result.output,
                            stderr: result.error,
                            time_ms: result.duration,
                            language: result.language,
                            executedBy: job.data.userName || 'System',
                        });
                    }

                    logger.success(`Job ${job.id} completed in ${result.duration}ms`);

                    return result;

                } catch (error) {
                    logger.error(`Job ${job.id} failed:`, error.message);

                    // Broadcast error to room
                    if (job.data.roomId && io) {
                        io.to(job.data.roomId).emit(SOCKET_EVENTS.EXECUTION_ERROR, {
                            jobId: job.id,
                            error: error.message,
                        });
                    }

                    throw error;
                }
            },
            WORKER_OPTIONS
        );

        // Event handlers
        this.worker.on('completed', (job) => {
            logger.info(`Job ${job.id} completed`);
        });

        this.worker.on('failed', (job, error) => {
            logger.error(`Job ${job?.id} failed:`, error.message);
        });

        this.worker.on('error', (error) => {
            logger.error('Worker error:', error.message);
        });

        this.worker.on('stalled', (jobId) => {
            logger.warning(`Job ${jobId} stalled`);
        });

        this.isRunning = true;
        logger.success('Execution worker started');
    }

    async stop() {
        if (this.worker) {
            await this.worker.close();
            this.isRunning = false;
            logger.info('Execution worker stopped');
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            concurrency: WORKER_OPTIONS.concurrency,
        };
    }
}

// Singleton instance
export const executionWorker = new ExecutionWorker();

export default executionWorker;
