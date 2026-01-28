// Use VITE_API_URL from environment, or fallback to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const SOCKET_EVENTS = {
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',

  // Code events
  CODE_UPDATE: 'code_update',
  LOAD_CODE: 'load_code',
  CURSOR_MOVE: 'cursor_move',

  // Execution events
  EXECUTE_CODE: 'execute_code',
  EXECUTION_RESULT: 'execution_result',
  EXECUTION_ERROR: 'execution_error',

  // AI events
  REQUEST_HINT: 'request_hint',
  HINT_RESPONSE: 'hint_response',
  REQUEST_AI_FEEDBACK: 'request_ai_feedback',
  AI_FEEDBACK_RESPONSE: 'ai_feedback_response',

  // General
  ERROR: 'error',
};

// 40+ Supported Languages (Piston API)
export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'scala', label: 'Scala' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'julia', label: 'Julia' },
  { value: 'r', label: 'R' },
  { value: 'perl', label: 'Perl' },
  { value: 'lua', label: 'Lua' },
  { value: 'dart', label: 'Dart' },
  { value: 'bash', label: 'Bash' },
  { value: 'erlang', label: 'Erlang' },
  { value: 'fsharp', label: 'F#' },
  { value: 'fortran', label: 'Fortran' },
  { value: 'assembly', label: 'Assembly (NASM)' },
  { value: 'cobol', label: 'COBOL' },
  { value: 'lisp', label: 'Common Lisp' },
  { value: 'd', label: 'D' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'nim', label: 'Nim' },
  { value: 'ocaml', label: 'OCaml' },
  { value: 'pascal', label: 'Pascal' },
  { value: 'prolog', label: 'Prolog' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'racket', label: 'Racket' },
  { value: 'crystal', label: 'Crystal' },
  { value: 'zig', label: 'Zig' },
  { value: 'vlang', label: 'V' }
];

export const LANGUAGE_VERSIONS = {
  javascript: '18.15.0',
  typescript: '5.0.3',
  python: '3.10.0',
  java: '15.0.2',
  cpp: '10.2.0',
  go: '1.16.2',
  rust: '1.68.2',
  // ... more versions can be added if needed
};
