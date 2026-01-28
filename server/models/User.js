export class User {
  constructor(userId, userName, socketId, roomId) {
    this.userId = userId;
    this.userName = userName;
    this.socketId = socketId;
    this.roomId = roomId;
    this.connectedAt = new Date();
    this.lastActivity = new Date();
    this.isActive = true;
    this.cursorPosition = {
      line: 0,
      column: 0,
    };
    this.stats = {
      codeChanges: 0,
      executionsRun: 0,
      hintsRequested: 0,
    };
  }

  // Update cursor position
  updateCursor(line, column) {
    this.cursorPosition = { line, column };
    this.lastActivity = new Date();
  }

  // Track user action
  trackAction(actionType) {
    this.lastActivity = new Date();
    
    switch (actionType) {
      case 'code_change':
        this.stats.codeChanges++;
        break;
      case 'execution':
        this.stats.executionsRun++;
        break;
      case 'hint_request':
        this.stats.hintsRequested++;
        break;
    }
  }

  // Mark user as inactive
  markInactive() {
    this.isActive = false;
  }

  // Get session duration
  getSessionDuration() {
    return Date.now() - this.connectedAt.getTime();
  }

  // Convert to JSON
  toJSON() {
    return {
      userId: this.userId,
      userName: this.userName,
      socketId: this.socketId,
      roomId: this.roomId,
      connectedAt: this.connectedAt,
      isActive: this.isActive,
      cursorPosition: this.cursorPosition,
      stats: this.stats,
      sessionDuration: this.getSessionDuration(),
    };
  }

  // Mongoose schema for future migration
  static getMongooseSchema() {
    return {
      userId: { type: String, required: true, unique: true },
      userName: { type: String, required: true },
      email: { type: String, sparse: true },
      createdAt: { type: Date, default: Date.now },
      lastLogin: { type: Date, default: Date.now },
      totalRoomsJoined: { type: Number, default: 0 },
      totalCodeExecutions: { type: Number, default: 0 },
      preferredLanguage: { type: String, default: 'javascript' },
      settings: {
        theme: { type: String, default: 'vs-dark' },
        fontSize: { type: Number, default: 14 },
        tabSize: { type: Number, default: 2 },
      },
    };
  }
}
