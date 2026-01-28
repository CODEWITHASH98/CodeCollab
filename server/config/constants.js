export const CONFIG = {
  PORT: process.env.PORT || 3001,
  CLIENT_URL: (process.env.CLIENT_URL || 'https://code-collab-opal.vercel.app').replace(/\/$/, ''),
  NODE_ENV: process.env.NODE_ENV || 'production',
  JWT_SECRET: process.env.JWT_SECRET,

  // Code execution limits
  CODE_EXECUTION: {
    TIMEOUT: 10000,
    MAX_OUTPUT_LENGTH: 10000,
  },

  // Room settings
  ROOM: {
    ID_LENGTH: 8,
    MAX_PARTICIPANTS: 10,
    DEFAULT_LANGUAGE: 'javascript',
    EXPIRY_TIME: 24 * 60 * 60 * 1000,
  },

  // Supported languages
  LANGUAGES: [
    'javascript',
    'python',
    'java',
    'cpp',
    'c',
    'go',
    'rust',
    'typescript'
  ],

  // AI settings
  AI: {
    MAX_HINTS_PER_SESSION: 10,
    HINT_COOLDOWN: 30000, // 30 seconds
    REVIEW_COOLDOWN: 60000, // 1 minute
    EXPLAIN_COOLDOWN: 60000, // 1 minute
    CACHE_TTL: 86400, // 24 hours (seconds)
    OPENAI_MODEL: 'gpt-4-turbo-preview',
    MAX_TOKENS: 1000,
  }
};

export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  CODE_UPDATE: 'code_update',
  LOAD_CODE: 'load_code',
  CURSOR_MOVE: 'cursor_move',
  EXECUTE_CODE: 'execute_code',
  EXECUTION_RESULT: 'execution_result',
  EXECUTION_ERROR: 'execution_error',
  REQUEST_HINT: 'request_hint',
  HINT_RESPONSE: 'hint_response',
  REQUEST_AI_FEEDBACK: 'request_ai_feedback',
  AI_FEEDBACK_RESPONSE: 'ai_feedback_response',
  GET_PERSONALITY_SCORE: 'get_personality_score',
  PERSONALITY_SCORE: 'personality_score',
  END_SESSION: 'end_session',
  ASSESSMENT_REPORT: 'assessment_report',
  ERROR: 'error',
};

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_FULL: 'Room is full',
  INVALID_CODE: 'Invalid code provided',
  EXECUTION_TIMEOUT: 'Code execution timed out',
  LANGUAGE_NOT_SUPPORTED: 'Language not supported',
  HINT_COOLDOWN: 'Please wait before requesting another hint',
  AI_SERVICE_UNAVAILABLE: 'AI service temporarily unavailable',
  SESSION_NOT_FOUND: 'Session not found',
  AUTHENTICATION_FAILED: 'Authentication failed',
};
