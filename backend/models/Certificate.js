const mongoose = require('mongoose');
const crypto = require('crypto');

const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value._id) return value._id.toString();
  return value.toString();
};

const certificateSchema = new mongoose.Schema({
  // Certificate ID (unique, public)
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Certificate context
  certificateType: {
    type: String,
    enum: ['skill', 'learning_path'],
    default: 'skill',
    index: true
  },

  // User and Skill
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: function requiredSkill() {
      return this.certificateType !== 'learning_path';
    }
  },

  learningPath: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: function requiredLearningPath() {
      return this.certificateType === 'learning_path';
    }
  },

  pathEnrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PathEnrollment'
  },
  
  // Linked verification
  verification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillVerification',
    required: function requiredVerification() {
      return this.certificateType !== 'learning_path';
    }
  },
  
  // Certificate details
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // Verification info
  verificationMethod: {
    type: String,
    enum: ['quiz', 'portfolio', 'peer_review', 'expert_review', 'endorsement', 'learning_path'],
    required: true
  },
  score: Number, // For quiz
  rating: Number, // For reviews
  
  // Dates
  issuedDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresDate: Date,
  
  // Issuer (SkillBarter platform)
  issuer: {
    name: {
      type: String,
      default: 'SkillBarter'
    },
    logo: {
      type: String,
      default: '/logo.png'
    }
  },
  
  // Badge
  badge: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  
  // Public sharing
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Verification hash (for authenticity)
  verificationHash: {
    type: String,
    required: true
  },
  
  // PDF file path
  pdfPath: String,
  
  // Views and shares
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // Revoked
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedReason: String
}, {
  timestamps: true
});

// Generate required values before Mongoose required-field validation runs
certificateSchema.pre('validate', function(next) {
  if (!this.issuedDate) {
    this.issuedDate = new Date();
  }

  if (!this.certificateId) {
    this.certificateId = `SB-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
  
  if (!this.verificationHash) {
    const subjectId = this.certificateType === 'learning_path'
      ? getEntityId(this.learningPath)
      : getEntityId(this.skill);
    const hashData = `${this.certificateId}-${getEntityId(this.user)}-${subjectId}-${this.issuedDate}`;
    this.verificationHash = crypto.createHash('sha256').update(hashData).digest('hex');
  }
  
  next();
});

// Determine badge level based on verification details
certificateSchema.methods.determineBadge = function() {
  if (this.verificationMethod === 'expert_review') {
    if (this.rating >= 4.5) return 'platinum';
    if (this.rating >= 4) return 'gold';
    return 'silver';
  }
  
  if (this.verificationMethod === 'quiz') {
    if (this.score >= 95) return 'platinum';
    if (this.score >= 85) return 'gold';
    if (this.score >= 75) return 'silver';
    return 'bronze';
  }

  if (this.verificationMethod === 'learning_path') {
    if (this.score >= 95) return 'platinum';
    if (this.score >= 85) return 'gold';
    if (this.score >= 75) return 'silver';
    return 'bronze';
  }
  
  if (this.verificationMethod === 'peer_review') {
    if (this.rating >= 4.8) return 'platinum';
    if (this.rating >= 4.5) return 'gold';
    if (this.rating >= 4) return 'silver';
    return 'bronze';
  }
  
  return 'bronze';
};

// Verify certificate authenticity
certificateSchema.methods.verifyAuthenticity = function() {
  const userId = getEntityId(this.user);
  const subjectId = this.certificateType === 'learning_path'
    ? getEntityId(this.learningPath)
    : getEntityId(this.skill);
  const hashData = `${this.certificateId}-${userId}-${subjectId}-${this.issuedDate}`;
  const expectedHash = crypto.createHash('sha256').update(hashData).digest('hex');
  return this.verificationHash === expectedHash && !this.isRevoked;
};

// Get public URL
certificateSchema.methods.getPublicUrl = function() {
  return `/certificates/verify/${this.certificateId}`;
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
