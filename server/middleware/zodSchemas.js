/**
 * Zod Validation Schemas
 * 
 * Type-safe request validation for all API endpoints
 */

import { z } from 'zod';

// ============ Auth Schemas ============

export const guestLoginSchema = z.object({
    userName: z.string()
        .min(1, 'Name is required')
        .max(50, 'Name too long')
        .trim()
        .transform(val => val.replace(/[<>]/g, '')), // Basic XSS prevention
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1).max(100).trim(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
});

// ============ Room Schemas ============

export const roomIdSchema = z.object({
    roomId: z.string()
        .regex(/^code-[a-zA-Z0-9]{6,12}$/, 'Invalid room ID format'),
});

export const createRoomSchema = z.object({
    name: z.string().max(100).optional(),
    language: z.string().default('javascript'),
}).optional();

// ============ Code Execution Schemas ============

const SUPPORTED_LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
    'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
    'scala', 'r', 'perl', 'lua', 'bash', 'haskell', 'elixir',
    'clojure', 'dart', 'julia', 'fsharp', 'cobol', 'fortran',
    'pascal', 'groovy', 'nim', 'crystal', 'zig', 'vlang',
    'racket', 'prolog', 'lisp', 'erlang', 'ocaml', 'd', 'assembly'
];

export const executeCodeSchema = z.object({
    code: z.string()
        .max(64 * 1024, 'Code too long (max 64KB)'),
    language: z.string()
        .refine(lang => SUPPORTED_LANGUAGES.includes(lang.toLowerCase()), {
            message: 'Unsupported language',
        }),
    stdin: z.string().max(1024 * 10).optional(), // 10KB max input
});

export const hintRequestSchema = z.object({
    code: z.string().max(64 * 1024),
    language: z.string(),
    problemContext: z.string().max(2000).optional(),
});

export const reviewRequestSchema = z.object({
    code: z.string().max(64 * 1024),
    language: z.string(),
});

// ============ Validator Middleware Factory ============

/**
 * Creates validation middleware for request body
 */
export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: result.error.issues[0].message,
                    field: result.error.issues[0].path.join('.'),
                },
            });
        }

        req.validated = result.data;
        next();
    };
}

/**
 * Creates validation middleware for URL params
 */
export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: result.error.issues[0].message,
                    field: result.error.issues[0].path.join('.'),
                },
            });
        }

        req.validatedParams = result.data;
        next();
    };
}

/**
 * Creates validation middleware for query params
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: result.error.issues[0].message,
                    field: result.error.issues[0].path.join('.'),
                },
            });
        }

        req.validatedQuery = result.data;
        next();
    };
}

export default {
    // Schemas
    guestLoginSchema,
    registerSchema,
    loginSchema,
    roomIdSchema,
    createRoomSchema,
    executeCodeSchema,
    hintRequestSchema,
    reviewRequestSchema,
    // Middleware factories
    validateBody,
    validateParams,
    validateQuery,
};
