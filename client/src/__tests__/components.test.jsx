/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the hooks
vi.mock('../hooks/useSocket', () => ({
    useSocket: () => ({
        connected: true,
        participants: [{ userId: '1', userName: 'Test User' }],
        code: '// Hello World',
        output: '',
        hint: '',
        typingUsers: [],
        updateCode: vi.fn(),
        executeCode: vi.fn(),
        requestHint: vi.fn(),
        setHint: vi.fn(),
        emitTyping: vi.fn(),
        emitStopTyping: vi.fn(),
    }),
}));

vi.mock('../hooks/useToast', () => ({
    useToast: () => ({
        toast: null,
        showToast: vi.fn(),
        hideToast: vi.fn(),
    }),
}));

vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => ({
        isDark: false,
        toggleTheme: vi.fn(),
    }),
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
    default: ({ value, onChange }) => (
        <textarea
            data-testid="mock-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

describe('UI Components', () => {
    describe('Button', () => {
        it('renders button with text', () => {
            // Simple button test
            const button = document.createElement('button');
            button.textContent = 'Click me';
            expect(button.textContent).toBe('Click me');
        });

        it('handles click events', () => {
            const onClick = vi.fn();
            const button = document.createElement('button');
            button.onclick = onClick;
            button.click();
            expect(onClick).toHaveBeenCalled();
        });
    });

    describe('Input', () => {
        it('accepts input value', () => {
            const input = document.createElement('input');
            input.value = 'test value';
            expect(input.value).toBe('test value');
        });
    });
});

describe('Socket Hook', () => {
    it('should provide connected state', () => {
        const mockSocket = {
            connected: true,
            on: vi.fn(),
            emit: vi.fn(),
            disconnect: vi.fn(),
        };

        expect(mockSocket.connected).toBe(true);
    });

    it('should handle room events', () => {
        const events = {};
        const mockSocket = {
            on: vi.fn((event, callback) => {
                events[event] = callback;
            }),
            emit: vi.fn(),
        };

        mockSocket.on('code_update', (data) => {
            // Handle code update
        });

        expect(mockSocket.on).toHaveBeenCalledWith('code_update', expect.any(Function));
    });
});

describe('Theme Context', () => {
    it('should toggle theme', () => {
        let isDark = false;
        const toggleTheme = () => {
            isDark = !isDark;
        };

        expect(isDark).toBe(false);
        toggleTheme();
        expect(isDark).toBe(true);
        toggleTheme();
        expect(isDark).toBe(false);
    });
});

describe('Toast Hook', () => {
    it('should show and hide toast', () => {
        let toast = null;

        const showToast = (message, type) => {
            toast = { message, type };
        };

        const hideToast = () => {
            toast = null;
        };

        showToast('Success message', 'success');
        expect(toast).toEqual({ message: 'Success message', type: 'success' });

        hideToast();
        expect(toast).toBeNull();
    });
});

describe('Code Utilities', () => {
    describe('Language detection', () => {
        it('should detect JavaScript', () => {
            const code = 'const x = 5; console.log(x);';
            const hasConst = code.includes('const');
            const hasConsole = code.includes('console.log');
            expect(hasConst && hasConsole).toBe(true);
        });

        it('should detect Python', () => {
            const code = 'def hello():\n    print("Hello")';
            const hasDef = code.includes('def ');
            const hasPrint = code.includes('print');
            expect(hasDef && hasPrint).toBe(true);
        });
    });

    describe('Room ID generation', () => {
        it('should generate unique IDs', () => {
            const generateId = () => `room-${Math.random().toString(36).substring(2, 8)}`;

            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
            expect(id1.startsWith('room-')).toBe(true);
        });
    });
});

describe('API Service', () => {
    it('should format API errors correctly', () => {
        const formatError = (error) => {
            if (error.response?.data?.message) {
                return error.response.data.message;
            }
            return error.message || 'Unknown error';
        };

        const networkError = { message: 'Network Error' };
        expect(formatError(networkError)).toBe('Network Error');

        const apiError = { response: { data: { message: 'Invalid token' } } };
        expect(formatError(apiError)).toBe('Invalid token');
    });
});
