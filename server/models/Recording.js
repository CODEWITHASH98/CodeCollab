export class Recording {
  constructor(roomId) {
    this.roomId = roomId;
    this.events = [];
    this.startTime = new Date();
    this.endTime = null;
    this.duration = 0;
    this.metadata = {
      totalParticipants: 0,
      totalExecutions: 0,
      totalHints: 0,
      languagesUsed: new Set(),
    };
  }

  // Add event to recording
  addEvent(eventType, data) {
    const event = {
      timestamp: new Date(),
      timeOffset: Date.now() - this.startTime.getTime(),
      type: eventType,
      data,
    };

    this.events.push(event);

    // Update metadata
    this.updateMetadata(eventType, data);

    return event;
  }

  // Update metadata based on event
  updateMetadata(eventType, data) {
    switch (eventType) {
      case 'user_joined':
        this.metadata.totalParticipants++;
        break;
      case 'execution':
        this.metadata.totalExecutions++;
        break;
      case 'hint_request':
        this.metadata.totalHints++;
        break;
      case 'language_change':
        this.metadata.languagesUsed.add(data.language);
        break;
    }
  }

  // Finalize recording
  finalize() {
    this.endTime = new Date();
    this.duration = this.endTime.getTime() - this.startTime.getTime();
    
    // Convert Set to Array for JSON serialization
    this.metadata.languagesUsed = Array.from(this.metadata.languagesUsed);
  }

  // Get playback events
  getPlaybackEvents() {
    return this.events.map(event => ({
      ...event,
      timestamp: event.timestamp.toISOString(),
    }));
  }

  // Export as JSON
  toJSON() {
    return {
      roomId: this.roomId,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      eventCount: this.events.length,
      metadata: {
        ...this.metadata,
        languagesUsed: Array.from(this.metadata.languagesUsed || []),
      },
      events: this.getPlaybackEvents(),
    };
  }

  // Export for download
  exportForDownload() {
    return {
      version: '1.0',
      roomId: this.roomId,
      exportedAt: new Date().toISOString(),
      recording: this.toJSON(),
    };
  }

  // Mongoose schema
  static getMongooseSchema() {
    return {
      roomId: { type: String, required: true, index: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      duration: { type: Number },
      events: [{
        timestamp: Date,
        timeOffset: Number,
        type: String,
        data: Object,
      }],
      metadata: {
        totalParticipants: Number,
        totalExecutions: Number,
        totalHints: Number,
        languagesUsed: [String],
      },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, expires: 2592000 }, // 30 days
    };
  }
}
