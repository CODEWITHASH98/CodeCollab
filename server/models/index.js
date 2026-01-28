import { Room } from './Room.js';
import { User } from './User.js';
import { Recording } from './Recording.js';
import { Problem, sampleProblems } from './Problem.js';

export { Room, User, Recording, Problem, sampleProblems };

// Model factory functions
export function createRoom(roomId, hostId) {
  return new Room(roomId, hostId);
}

export function createUser(userId, userName, socketId, roomId) {
  return new User(userId, userName, socketId, roomId);
}

export function createRecording(roomId) {
  return new Recording(roomId);
}

export function createProblem(data) {
  return new Problem(data);
}

// Data store (in-memory for now)
export const dataStore = {
  rooms: new Map(),
  users: new Map(),
  recordings: new Map(),
  problems: new Map(),

  // Initialize with sample problems
  init() {
    // This will be called on server start
  }
};
