import jwt from 'jsonwebtoken';
import { CONFIG } from './constants.js';

export function signToken(payload) {
  return jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, CONFIG.JWT_SECRET);
}
