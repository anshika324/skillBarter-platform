const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema({
  // Basic info
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Associated session/booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  videoCall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoCall'
  },
  
  // Room ID for real-time collaboration
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Canvas data
  canvas: {
    width: {
      type: Number,
      default: 1920
    },
    height: {
      type: Number,
      default: 1080
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    }
  },
  
  // Drawing elements
  elements: [{
    id: String,
    type: {
      type: String,
      enum: ['path', 'line', 'rectangle', 'circle', 'text', 'image', 'sticky-note']
    },
    
    // Path data
    points: [{
      x: Number,
      y: Number,
      pressure: Number
    }],
    
    // Shape data
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    radius: Number,
    
    // Text data
    text: String,
    fontSize: Number,
    fontFamily: String,
    
    // Image data
    imageUrl: String,
    
    // Style
    strokeColor: String,
    fillColor: String,
    strokeWidth: Number,
    opacity: Number,
    
    // Layer
    layer: {
      type: Number,
      default: 0
    },
    
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  
  // Layers
  layers: [{
    name: String,
    visible: {
      type: Boolean,
      default: true
    },
    locked: {
      type: Boolean,
      default: false
    },
    opacity: {
      type: Number,
      default: 1
    }
  }],
  
  // Template
  template: {
    type: String,
    enum: ['blank', 'grid', 'dots', 'lines', 'kanban', 'mindmap', 'flowchart', 'wireframe']
  },
  
  // Collaborators
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor'
    },
    cursor: {
      x: Number,
      y: Number,
      color: String
    },
    joinedAt: Date,
    lastSeenAt: Date
  }],
  
  // Permissions
  permissions: {
    public: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDownload: {
      type: Boolean,
      default: true
    }
  },
  
  // Version history
  versions: [{
    version: Number,
    snapshot: String, // Base64 image
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Export data
  exports: [{
    format: {
      type: String,
      enum: ['png', 'pdf', 'svg', 'json']
    },
    url: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  
  // Stats
  stats: {
    views: {
      type: Number,
      default: 0
    },
    edits: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
whiteboardSchema.index({ creator: 1, status: 1 });
whiteboardSchema.index({ 'collaborators.user': 1 });

// Add element
whiteboardSchema.methods.addElement = function(element) {
  element.id = element.id || `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.elements.push(element);
  this.stats.edits += 1;
};

// Update element
whiteboardSchema.methods.updateElement = function(elementId, updates) {
  const element = this.elements.id(elementId);
  if (element) {
    Object.assign(element, updates);
    element.updatedAt = new Date();
    this.stats.edits += 1;
    return element;
  }
  return null;
};

// Remove element
whiteboardSchema.methods.removeElement = function(elementId) {
  const index = this.elements.findIndex(el => el.id === elementId);
  if (index > -1) {
    this.elements.splice(index, 1);
    this.stats.edits += 1;
    return true;
  }
  return false;
};

// Add collaborator
whiteboardSchema.methods.addCollaborator = function(userId, role = 'editor') {
  const existing = this.collaborators.find(c => c.user.toString() === userId.toString());
  
  if (!existing) {
    this.collaborators.push({
      user: userId,
      role,
      joinedAt: new Date(),
      lastSeenAt: new Date()
    });
  } else {
    existing.lastSeenAt = new Date();
  }
};

// Update cursor position
whiteboardSchema.methods.updateCursor = function(userId, x, y, color) {
  const collaborator = this.collaborators.find(c => c.user.toString() === userId.toString());
  
  if (collaborator) {
    collaborator.cursor = { x, y, color };
    collaborator.lastSeenAt = new Date();
  }
};

// Create snapshot
whiteboardSchema.methods.createSnapshot = async function(userId, imageData) {
  const version = this.versions.length + 1;
  
  this.versions.push({
    version,
    snapshot: imageData,
    createdBy: userId,
    createdAt: new Date()
  });
  
  // Keep only last 10 versions
  if (this.versions.length > 10) {
    this.versions.shift();
  }
};

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);

module.exports = Whiteboard;
