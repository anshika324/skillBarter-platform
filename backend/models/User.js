const mongoose = require('mongoose');
const { VALID_ROLES, DEFAULT_ROLE } = require('../middleware/roles');
const {
  SKILL_LEVELS,
  LEARNING_LEVELS,
  SESSION_MODES,
  AVAILABILITY_DAYS,
  AVAILABILITY_TIME_SLOTS,
  DEFAULT_MATCH_PREFERENCES
} = require('../utils/matchmakingProfile');

const teachingSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    level: {
      type: String,
      enum: SKILL_LEVELS,
      default: 'intermediate'
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 60
    },
    tags: [String]
  },
  { _id: false }
);

const learningSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    currentLevel: {
      type: String,
      enum: LEARNING_LEVELS,
      default: 'beginner'
    },
    targetLevel: {
      type: String,
      enum: SKILL_LEVELS,
      default: 'intermediate'
    },
    priority: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    learningGoal: {
      type: String,
      maxlength: 200
    }
  },
  { _id: false }
);

const matchPreferencesSchema = new mongoose.Schema(
  {
    preferredSessionMode: {
      type: String,
      enum: SESSION_MODES,
      default: DEFAULT_MATCH_PREFERENCES.preferredSessionMode
    },
    availabilityDays: [
      {
        type: String,
        enum: AVAILABILITY_DAYS
      }
    ],
    availabilityTimeSlots: [
      {
        type: String,
        enum: AVAILABILITY_TIME_SLOTS
      }
    ],
    timezone: {
      type: String,
      default: DEFAULT_MATCH_PREFERENCES.timezone
    },
    maxWeeklyMatches: {
      type: Number,
      default: DEFAULT_MATCH_PREFERENCES.maxWeeklyMatches,
      min: 1,
      max: 20
    },
    languagePreferences: [String],
    onlyMutualBarter: {
      type: Boolean,
      default: DEFAULT_MATCH_PREFERENCES.onlyMutualBarter
    },
    isDiscoverable: {
      type: Boolean,
      default: DEFAULT_MATCH_PREFERENCES.isDiscoverable
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User'
  },
  bio: {
    type: String,
    maxlength: 500
  },
  timeCredits: {
    type: Number,
    default: 5,
    min: 0
  },
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    yearsOfExperience: Number
  }],
  teachingSkills: [teachingSkillSchema],
  learningSkills: [learningSkillSchema],
  matchPreferences: {
    type: matchPreferencesSchema,
    default: () => ({ ...DEFAULT_MATCH_PREFERENCES })
  },
  matchProfileCompleted: {
    type: Boolean,
    default: false
  },
  matchProfileUpdatedAt: {
    type: Date
  },
  interests: [String],
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native']
    }
  }],
  location: {
    city: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  verifiedSkills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: VALID_ROLES,
    default: DEFAULT_ROLE,
    index: true
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ 'location.city': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'teachingSkills.normalizedName': 1, isActive: 1 });
userSchema.index({ 'learningSkills.normalizedName': 1, isActive: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
