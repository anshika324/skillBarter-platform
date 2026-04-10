const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  // Basic info
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  // Creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Category and tags
  category: {
    type: String,
    required: true,
    index: true
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Difficulty level
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
    index: true
  },
  
  // Duration
  estimatedDuration: {
    hours: {
      type: Number,
      default: 0
    },
    weeks: {
      type: Number,
      default: 0
    }
  },
  
  // Modules/Steps
  modules: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      required: true
    },
    
    // Module content
    lessons: [{
      title: String,
      description: String,
      type: {
        type: String,
        enum: ['video', 'reading', 'exercise', 'quiz', 'project', 'session'],
        default: 'reading'
      },
      duration: Number, // in minutes
      content: String,
      resources: [{
        title: String,
        url: String,
        type: String
      }],
      
      // Related skill session
      skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      },
      
      // Quiz questions
      quiz: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String
      }],
      
      // Project requirements
      project: {
        requirements: [String],
        submissionInstructions: String,
        rubric: [{
          criteria: String,
          points: Number
        }]
      }
    }],
    
    // Prerequisites
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath'
    }],
    
    // Estimated duration
    duration: Number, // in minutes
    
    // Module is locked until prerequisites complete
    isLocked: {
      type: Boolean,
      default: false
    }
  }],
  
  // Learning outcomes
  outcomes: [{
    type: String
  }],
  
  // Prerequisites
  prerequisites: {
    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    paths: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath'
    }],
    description: String
  },
  
  // Target audience
  targetAudience: {
    type: String
  },
  
  // Certification
  certificate: {
    enabled: {
      type: Boolean,
      default: true
    },
    title: String,
    description: String,
    requirements: {
      minCompletionRate: {
        type: Number,
        default: 100
      },
      minQuizScore: {
        type: Number,
        default: 0
      },
      requiredProjects: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Media
  coverImage: {
    type: String
  },
  
  thumbnail: {
    type: String
  },
  
  // Stats
  stats: {
    enrollments: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
    }
  },
  
  // Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  publishedAt: Date,
  
  // Featured/Trending
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Price (if premium)
  price: {
    type: Number,
    default: 0
  },
  
  isPremium: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
learningPathSchema.index({ title: 'text', description: 'text' });
learningPathSchema.index({ category: 1, level: 1 });
learningPathSchema.index({ 'stats.enrollments': -1 });
learningPathSchema.index({ 'stats.averageRating': -1 });

// Generate slug from title
learningPathSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Calculate total duration
learningPathSchema.methods.calculateTotalDuration = function() {
  let total = 0;
  this.modules.forEach(module => {
    if (module.duration) {
      total += module.duration;
    } else {
      module.lessons.forEach(lesson => {
        if (lesson.duration) {
          total += lesson.duration;
        }
      });
    }
  });
  
  this.estimatedDuration.hours = Math.floor(total / 60);
  return total;
};

// Get total lessons count
learningPathSchema.methods.getTotalLessons = function() {
  return this.modules.reduce((total, module) => total + module.lessons.length, 0);
};

// Update average rating
learningPathSchema.methods.updateRating = function(newRating) {
  const total = this.stats.averageRating * this.stats.totalRatings;
  this.stats.totalRatings += 1;
  this.stats.averageRating = (total + newRating) / this.stats.totalRatings;
};

const LearningPath = mongoose.model('LearningPath', learningPathSchema);

module.exports = LearningPath;
