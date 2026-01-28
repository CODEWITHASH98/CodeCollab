import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config/constants.js';

export function generateRoomId() {
  return `code-${uuidv4().slice(0, CONFIG.ROOM.ID_LENGTH)}`;
}

export function generateUserId() {
  return `user-${uuidv4().slice(0, 12)}`;
}

export function sanitizeCode(code) {
  if (typeof code !== 'string') return '';
  return code.slice(0, CONFIG.CODE_EXECUTION.MAX_OUTPUT_LENGTH);
}

export function validateLanguage(language) {
  return CONFIG.LANGUAGES.includes(language);
}

export function formatTimestamp() {
  return new Date().toISOString();
}

// REMOVED: createRoomData - now using Room model
// REMOVED: addToRecording - now a Room model method
