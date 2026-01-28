import express from 'express';
import { roomController } from '../controllers/roomController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRoomId, validateRoomCreation } from '../middleware/validation.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create new room
router.post(
  '/',
  authenticateToken,
  validateRoomCreation,
  asyncHandler((req, res) => roomController.createRoom(req, res))
);

// Get room details
router.get(
  '/:roomId',
  validateRoomId,
  asyncHandler((req, res) => roomController.getRoom(req, res))
);

// Delete room
router.delete(
  '/:roomId',
  validateRoomId,
  asyncHandler((req, res) => roomController.deleteRoom(req, res))
);

// Get all active rooms
router.get(
  '/',
  asyncHandler((req, res) => roomController.getActiveRooms(req, res))
);

// Get room recording
router.get(
  '/:roomId/recording',
  validateRoomId,
  asyncHandler((req, res) => roomController.getRecording(req, res))
);

export default router;
