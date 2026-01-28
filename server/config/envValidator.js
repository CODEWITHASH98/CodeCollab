import { logger } from '../utils/logger.js';

const REQUIRED_ENV_VARS = [
    'JWT_SECRET',
    'DATABASE_URL',
    'CLIENT_URL'
];

export function validateEnv() {
    const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`);
        // In production, we should probably exit
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
        logger.warning('JWT_SECRET is not secure or using default value!');
    }

    logger.success('Environment variables validated');
}
