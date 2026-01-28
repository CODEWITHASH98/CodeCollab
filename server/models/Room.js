import { CONFIG } from '../config/constants.js';

export class Room {
  constructor(roomId, hostId) {
    this.id = roomId;
    this.hostId = hostId;
    this.participants = [];
    this.code = this.getDefaultCode();
    this.language = CONFIG.ROOM.DEFAULT_LANGUAGE;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.recording = [];
    this.hintUsage = {};
    this.settings = {
      maxParticipants: CONFIG.ROOM.MAX_PARTICIPANTS,
      allowHints: true,
      allowExecution: true,
      isPrivate: false,
    };
    this.metadata = {
      totalExecutions: 0,
      totalHintsUsed: 0,
      languageChanges: 0,
    };
  }

  getDefaultCode() {
    return `// Welcome to CodeCollab!
// Start coding here...

console.log("Hello, World!");

// Tips:
// - Code changes sync in real-time with all participants
// - Click 'Run Code' to execute your code
// - Click 'Get Hint' if you need help
`;
  }

  // Add participant to room
  addParticipant(participant) {
    if (this.participants.length >= this.settings.maxParticipants) {
      throw new Error('Room is full');
    }

    // Check if user already in room
    const existing = this.participants.find(p => p.userId === participant.userId);
    if (existing) {
      throw new Error('User already in room');
    }

    this.participants.push(participant);
    this.lastActivity = new Date();
    return true;
  }

  // Remove participant from room
  removeParticipant(socketId) {
    const index = this.participants.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      this.participants.splice(index, 1);
      this.lastActivity = new Date();
      return true;
    }
    return false;
  }

  // Get participant by socket ID
  getParticipantBySocket(socketId) {
    return this.participants.find(p => p.socketId === socketId);
  }

  // Get participant by user ID
  getParticipantByUserId(userId) {
    return this.participants.find(p => p.userId === userId);
  }

  // Update code
  updateCode(code) {
    this.code = code;
    this.lastActivity = new Date();
  }

  // Change language
  changeLanguage(language) {
    this.language = language;
    this.metadata.languageChanges++;
    this.lastActivity = new Date();
  }

  // Add to recording
  addRecordingEvent(eventType, data) {
    this.recording.push({
      timestamp: new Date(),
      type: eventType,
      data,
    });

    // Limit recording size
    if (this.recording.length > 1000) {
      this.recording = this.recording.slice(-1000);
    }
  }

  // Track code execution
  trackExecution(userId, duration, success) {
    this.metadata.totalExecutions++;
    this.addRecordingEvent('execution', {
      userId,
      duration,
      success,
      language: this.language,
    });
  }

  // Track hint usage
  trackHint(userId) {
    if (!this.hintUsage) {
      this.hintUsage = {};
    }
    
    // Initialize as object if doesn't exist or is wrong type
    if (!this.hintUsage[userId] || typeof this.hintUsage[userId] !== 'object') {
      this.hintUsage[userId] = {
        count: 0,
        lastRequestTime: null
      };
    }

    this.hintUsage[userId].count++;
    this.hintUsage[userId].lastRequestTime = Date.now();
    this.metadata.totalHintsUsed++;
  }

  // Check if room is empty
  isEmpty() {
    return this.participants.length === 0;
  }

  // Check if room has expired
  isExpired() {
    const expiryTime = new Date(this.createdAt.getTime() + CONFIG.ROOM.EXPIRY_TIME);
    return new Date() > expiryTime;
  }

  // Get room summary
  toJSON() {
    return {
      id: this.id,
      hostId: this.hostId,
      participantCount: this.participants.length,
      participants: this.participants.map(p => ({
        userId: p.userId,
        userName: p.userName,
        joinedAt: p.joinedAt,
      })),
      language: this.language,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      settings: this.settings,
      metadata: this.metadata,
    };
  }

  // Convert to MongoDB schema format (for future migration)
  static getMongooseSchema() {
    return {
      id: { type: String, required: true, unique: true },
      hostId: { type: String, required: true },
      participants: [{
        userId: String,
        userName: String,
        socketId: String,
        joinedAt: Date,
        cursorPosition: {
          line: Number,
          column: Number,
        },
      }],
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
      createdAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      recording: [{
        timestamp: Date,
        type: String,
        data: Object,
      }],
      hintUsage: { type: Map, of: Object },
      settings: {
        maxParticipants: { type: Number, default: 10 },
        allowHints: { type: Boolean, default: true },
        allowExecution: { type: Boolean, default: true },
        isPrivate: { type: Boolean, default: false },
      },
      metadata: {
        totalExecutions: { type: Number, default: 0 },
        totalHintsUsed: { type: Number, default: 0 },
        languageChanges: { type: Number, default: 0 },
      },
    };
  }
}
