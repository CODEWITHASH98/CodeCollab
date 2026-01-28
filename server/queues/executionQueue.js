import { Queue } from 'bullmq';
import { logger } from '../utils/logger.js';
import Redis from 'ioredis';
import { getSanitizedRedisUrl } from '../config/redis.js';

// Code Execution Queue Configuration
const QUEUE_NAME = 'code-execution';

// Queue options
const queueOptions = {
    connection: new Redis(getSanitizedRedisUrl(), {
        maxRetriesPerRequest: null, // REQUIRED for BullMQ
        enableReadyCheck: false,
    }),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000,
        },
        removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
        },
    },
};

// Create the execution queue
export const executionQueue = new Queue(QUEUE_NAME, queueOptions);

// Job status tracking
export const JobStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    TIMEOUT: 'timeout',
};

/**
 * Add a code execution job to the queue
 * @param {Object} jobData - Job data
 * @param {string} jobData.code - Code to execute
 * @param {string} jobData.language - Programming language
 * @param {string} jobData.roomId - Room ID for result broadcasting
 * @param {string} jobData.userId - User who submitted the code
 * @param {Object} options - Job options
 * @returns {Promise<Object>} - Job info
 */
export async function addExecutionJob(jobData, options = {}) {
    const {
        code,
        language,
        roomId,
        userId,
        stdin = '',
        timeout = 10000,
    } = jobData;

    if (!code || !language) {
        throw new Error('Code and language are required');
    }

    const job = await executionQueue.add(
        'execute',
        {
            code,
            language,
            roomId,
            userId,
            stdin,
            timeout,
            createdAt: Date.now(),
        },
        {
            priority: options.priority || 1,
            timeout: timeout + 5000, // Buffer for job timeout
            ...options,
        }
    );

    logger.info(`Execution job ${job.id} added for ${language} code`);

    return {
        jobId: job.id,
        status: JobStatus.PENDING,
    };
}

/**
 * Get job status and result
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Job status and result
 */
export async function getJobStatus(jobId) {
    const job = await executionQueue.getJob(jobId);

    if (!job) {
        return { status: 'not_found' };
    }

    const state = await job.getState();
    const result = job.returnvalue;
    const progress = job.progress;

    return {
        jobId,
        status: state,
        progress,
        result: result || null,
        error: job.failedReason || null,
        attempts: job.attemptsMade,
        createdAt: job.timestamp,
    };
}

/**
 * Cancel a pending job
 * @param {string} jobId - Job ID
 * @returns {Promise<boolean>}
 */
export async function cancelJob(jobId) {
    const job = await executionQueue.getJob(jobId);

    if (!job) {
        return false;
    }

    const state = await job.getState();

    if (state === 'waiting' || state === 'delayed') {
        await job.remove();
        logger.info(`Job ${jobId} cancelled`);
        return true;
    }

    return false;
}

/**
 * Get queue statistics
 * @returns {Promise<Object>}
 */
export async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        executionQueue.getWaitingCount(),
        executionQueue.getActiveCount(),
        executionQueue.getCompletedCount(),
        executionQueue.getFailedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        total: waiting + active + completed + failed,
    };
}

/**
 * Clean old jobs
 * @param {number} olderThan - Milliseconds
 */
export async function cleanOldJobs(olderThan = 86400000) {
    const cleaned = await executionQueue.clean(olderThan, 'completed');
    logger.info(`Cleaned ${cleaned.length} old completed jobs`);
    return cleaned.length;
}

// Graceful shutdown
export async function closeQueue() {
    await executionQueue.close();
    logger.info('Execution queue closed');
}

export default executionQueue;
