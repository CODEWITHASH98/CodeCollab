import { CONFIG, ERROR_MESSAGES } from '../config/constants.js';
import { validateLanguage } from '../utils/helpers.js';

export function validateRoomCreation(req, res, next) {
  // No body validation needed for room creation
  next();
}

export function validateRoomId(req, res, next) {
  const { roomId } = req.params;
  
  if (!roomId || !roomId.startsWith('code-')) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid room ID format' },
    });
  }
  
  next();
}

export function validateCodeExecution(data) {
  const { code, language } = data;
  
  if (!code || typeof code !== 'string') {
    throw new Error(ERROR_MESSAGES.INVALID_CODE);
  }
  
  if (!validateLanguage(language)) {
    throw new Error(ERROR_MESSAGES.LANGUAGE_NOT_SUPPORTED);
  }
  
  return true;
}
