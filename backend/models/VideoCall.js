const mongoose = require('mongoose');

const videoCallSchema = new mongoose.Schema({
  // Related booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['host', 'participant'],
      default: 'participant'
    },
    joinedAt: Date,
    leftAt: Date,
    duration: Number, // in seconds
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  }],
  
  // Call details
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Call status
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'active', 'ended', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  
  // Call type
  callType: {
    type: String,
    enum: ['one-on-one', 'group'],
    default: 'one-on-one'
  },
  
  // Scheduled time
  scheduledStart: {
    type: Date,
    required: true,
    index: true
  },
  scheduledEnd: Date,
  
  // Actual times
  actualStart: Date,
  actualEnd: Date,
  duration: Number, // in seconds
  
  // Features used
  featuresUsed: {
    screenShare: {
      type: Boolean,
      default: false
    },
    recording: {
      type: Boolean,
      default: false
    },
    chat: {
      type: Boolean,
      default: false
    },
    whiteboard: {
      type: Boolean,
      default: false
    }
  },
  
  // Recording
  recording: {
    isRecorded: {
      type: Boolean,
      default: false
    },
    recordingUrl: String,
    recordingDuration: Number,
    recordingSize: Number, // in bytes
    recordingStarted: Date,
    recordingStopped: Date
  },
  
  // Quality settings
  quality: {
    video: {
      type: String,
      enum: ['hd', 'sd', 'audio-only'],
      default: 'sd'
    },
    maxParticipants: {
      type: Number,
      default: 2
    }
  },
  
  // Chat messages
  chatMessages: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSystemMessage: {
      type: Boolean,
      default: false
    }
  }],
  
  // Connection issues
  issues: [{
    type: {
      type: String,
      enum: ['connection_lost', 'poor_quality', 'audio_issue', 'video_issue']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Feedback
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
videoCallSchema.index({ roomId: 1, status: 1 });
videoCallSchema.index({ 'participants.user': 1 });
videoCallSchema.index({ scheduledStart: 1, status: 1 });

// Calculate actual duration
videoCallSchema.methods.calculateDuration = function() {
  if (this.actualStart && this.actualEnd) {
    this.duration = Math.floor((this.actualEnd - this.actualStart) / 1000);
  }
  return this.duration;
};

// Add chat message
videoCallSchema.methods.addChatMessage = function(userId, message, isSystem = false) {
  this.chatMessages.push({
    user: isSystem ? null : userId,
    message,
    timestamp: new Date(),
    isSystemMessage: isSystem
  });
};

// Report issue
videoCallSchema.methods.reportIssue = function(userId, issueType) {
  this.issues.push({
    type: issueType,
    user: userId,
    timestamp: new Date(),
    resolved: false
  });
};

// Start call
videoCallSchema.methods.startCall = function() {
  this.status = 'active';
  this.actualStart = new Date();
  this.addChatMessage(null, 'Call started', true);
};

// End call
videoCallSchema.methods.endCall = function() {
  this.status = 'ended';
  this.actualEnd = new Date();
  this.calculateDuration();
  this.addChatMessage(null, 'Call ended', true);
};

// User joins
videoCallSchema.methods.userJoins = function(userId, role = 'participant') {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant) {
    participant.joinedAt = new Date();
  } else {
    this.participants.push({
      user: userId,
      role,
      joinedAt: new Date()
    });
  }
  
  if (this.status === 'waiting') {
    this.startCall();
  }
};

// User leaves
videoCallSchema.methods.userLeaves = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (participant && participant.joinedAt) {
    participant.leftAt = new Date();
    participant.duration = Math.floor((participant.leftAt - participant.joinedAt) / 1000);
  }
  
  // Check if all users left
  const activeParticipants = this.participants.filter(p => p.joinedAt && !p.leftAt);
  if (activeParticipants.length === 0 && this.status === 'active') {
    this.endCall();
  }
};

const VideoCall = mongoose.model('VideoCall', videoCallSchema);

module.exports = VideoCall;