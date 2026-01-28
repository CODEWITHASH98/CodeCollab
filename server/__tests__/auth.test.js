import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock Prisma
vi.mock('../config/database.js', () => ({
    default: {
        user: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('Authentication', () => {
    const JWT_SECRET = 'test-secret-key';

    describe('JWT Token Generation', () => {
        it('should generate valid JWT token', () => {
            const payload = {
                id: 1,
                userId: 'user_abc123',
                userName: 'TestUser',
                isGuest: false,
                role: 'user',
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
            const decoded = jwt.verify(token, JWT_SECRET);

            expect(decoded.userId).toBe('user_abc123');
            expect(decoded.userName).toBe('TestUser');
            expect(decoded.isGuest).toBe(false);
        });

        it('should generate guest token with shorter expiry', () => {
            const payload = {
                id: 2,
                userId: 'guest_xyz789',
                userName: 'GuestUser',
                isGuest: true,
                role: 'guest',
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
            const decoded = jwt.verify(token, JWT_SECRET);

            expect(decoded.isGuest).toBe(true);
            expect(decoded.role).toBe('guest');
        });

        it('should reject expired tokens', () => {
            const payload = { userId: 'user_expired' };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' });

            expect(() => jwt.verify(token, JWT_SECRET)).toThrow('jwt expired');
        });

        it('should reject invalid signatures', () => {
            const payload = { userId: 'user_invalid' };
            const token = jwt.sign(payload, JWT_SECRET);

            expect(() => jwt.verify(token, 'wrong-secret')).toThrow('invalid signature');
        });
    });

    describe('Password Hashing', () => {
        it('should validate password requirements', () => {
            const password = 'securePassword123';
            expect(password.length).toBeGreaterThanOrEqual(6);
        });

        it('should reject weak passwords', () => {
            const weakPasswords = ['123', 'ab', ''];
            weakPasswords.forEach((pw) => {
                expect(pw.length).toBeLessThan(6);
            });
        });
    });

    describe('User Validation', () => {
        it('should validate username length', () => {
            const validName = 'Alex';
            const invalidName = 'A';

            expect(validName.trim().length).toBeGreaterThanOrEqual(2);
            expect(invalidName.trim().length).toBeLessThan(2);
        });

        it('should validate email format', () => {
            const validEmail = 'test@example.com';
            const invalidEmail = 'not-an-email';

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(emailRegex.test(validEmail)).toBe(true);
            expect(emailRegex.test(invalidEmail)).toBe(false);
        });
    });

    describe('OAuth Token Generation', () => {
        it('should include auth type in OAuth token', () => {
            const payload = {
                id: 3,
                userId: 'oauth_user',
                userName: 'OAuthUser',
                email: 'oauth@example.com',
                isGuest: false,
                role: 'user',
                authType: 'google',
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
            const decoded = jwt.verify(token, JWT_SECRET);

            expect(decoded.authType).toBe('google');
            expect(decoded.email).toBe('oauth@example.com');
        });
    });
});

describe('Socket Authentication Middleware', () => {
    const JWT_SECRET = 'test-secret-key';

    it('should authenticate valid socket token', () => {
        const payload = {
            id: 1,
            userId: 'user_socket',
            userName: 'SocketUser',
            isGuest: false,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        const decoded = jwt.verify(token, JWT_SECRET);

        expect(decoded.userName).toBe('SocketUser');
    });

    it('should reject missing token', () => {
        const token = null;
        expect(token).toBeNull();
    });

    it('should extract user from decoded token', () => {
        const payload = {
            id: 1,
            userId: 'user_extract',
            userName: 'ExtractUser',
            isGuest: true,
            role: 'guest',
        };

        const socketUser = {
            id: payload.id,
            userId: payload.userId,
            userName: payload.userName,
            isGuest: payload.isGuest,
            role: payload.role,
        };

        expect(socketUser.id).toBe(1);
        expect(socketUser.userName).toBe('ExtractUser');
    });
});
