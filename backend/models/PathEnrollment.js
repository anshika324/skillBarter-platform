const mongoose = require('mongoose');

const pathEnrollmentSchema = new mongoose.Schema({
  // User and Path
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  path: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath',
    required: true,
    index: true
  },
  
  // Enrollment status
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'dropped'],
    default: 'active',
    index: true
  },
  
  // Progress tracking
  progress: {
    currentModule: {
      type: Number,
      default: 0
    },
    currentLesson: {
      type: Number,
      default: 0
    },
    completedModules: [{
      type: Number
    }],
    completedLessons: [{
      moduleIndex: Number,
      lessonIndex: Number,
      completedAt: Date,
      score: Number, // For quizzes
      timeSpent: Number // in minutes
    }],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Quiz scores
  quizScores: [{
    moduleIndex: Number,
    lessonIndex: Number,
    score: Number,
    maxScore: Number,
    attempts: Number,
    lastAttempt: Date
  }],
  
  // Projects submitted
  projects: [{
    moduleIndex: Number,
    lessonIndex: Number,
    submissionUrl: String,
    submittedAt: Date,
    feedback: String,
    score: Number,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected']
    }
  }],
  
  // Time tracking
  timeSpent: {
    total: {
      type: Number,
      default: 0
    },
    byModule: [{
      moduleIndex: Number,
      minutes: Number
    }]
  },
  
  // Dates
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  
  startedAt: Date,
  
  completedAt: Date,
  
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  // Target completion date
  targetCompletionDate: Date,
  
  // Notes and bookmarks
  notes: [{
    moduleIndex: Number,
    lessonIndex: Number,
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  bookmarks: [{
    moduleIndex: Number,
    lessonIndex: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Rating and feedback
  rating: {
    value: Number,
    feedback: String,
    submittedAt: Date
  },
  
  // Certificate
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    certificateId: String,
    issuedAt: Date
  },
  
  // Streaks
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  }
}, {
  timestamps: true
});

// Compound indexes
pathEnrollmentSchema.index({ user: 1, path: 1 }, { unique: true });
pathEnrollmentSchema.index({ user: 1, status: 1 });
pathEnrollmentSchema.index({ path: 1, status: 1 });

// Calculate overall progress
pathEnrollmentSchema.methods.calculateProgress = async function() {
  const path = await mongoose.model('LearningPath').findById(this.path);
  
  if (!path) return 0;
  
  const totalLessons = path.getTotalLessons();
  const completedLessons = this.progress.completedLessons.length;
  
  this.progress.overallProgress = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  
  return this.progress.overallProgress;
};

// Mark lesson as complete
pathEnrollmentSchema.methods.completeLesson = function(moduleIndex, lessonIndex, score = null, timeSpent = 0) {
  // Check if already completed
  const existing = this.progress.completedLessons.find(
    l => l.moduleIndex === moduleIndex && l.lessonIndex === lessonIndex
  );
  
  if (!existing) {
    this.progress.completedLessons.push({
      moduleIndex,
      lessonIndex,
      completedAt: new Date(),
      score,
      timeSpent
    });
  }
  
  // Update time spent
  this.timeSpent.total += timeSpent;
  
  const moduleTime = this.timeSpent.byModule.find(m => m.moduleIndex === moduleIndex);
  if (moduleTime) {
    moduleTime.minutes += timeSpent;
  } else {
    this.timeSpent.byModule.push({
      moduleIndex,
      minutes: timeSpent
    });
  }
  
  // Update last accessed
  this.lastAccessedAt = new Date();
  
  // Update streak
  this.updateStreak();
};

// Check if module is completed
pathEnrollmentSchema.methods.isModuleCompleted = async function(moduleIndex) {
  const path = await mongoose.model('LearningPath').findById(this.path);
  
  if (!path || !path.modules[moduleIndex]) return false;
  
  const moduleLessons = path.modules[moduleIndex].lessons.length;
  const completedInModule = this.progress.completedLessons.filter(
    l => l.moduleIndex === moduleIndex
  ).length;
  
  return completedInModule === moduleLessons;
};

// Mark module as complete
pathEnrollmentSchema.methods.completeModule = function(moduleIndex) {
  if (!this.progress.completedModules.includes(moduleIndex)) {
    this.progress.completedModules.push(moduleIndex);
  }
};

// Update streak
pathEnrollmentSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.streak.lastActivityDate 
    ? new Date(this.streak.lastActivityDate)
    : null;
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
    } else {
      // Streak broken
      this.streak.current = 1;
    }
  } else {
    // First activity
    this.streak.current = 1;
    this.streak.longest = 1;
  }
  
  this.streak.lastActivityDate = new Date();
};

// Check if path is completed
pathEnrollmentSchema.methods.checkCompletion = async function() {
  await this.calculateProgress();
  
  if (this.progress.overallProgress >= 100) {
    this.status = 'completed';
    this.completedAt = new Date();
    return true;
  }
  
  return false;
};

// Get next lesson
pathEnrollmentSchema.methods.getNextLesson = async function() {
  const path = await mongoose.model('LearningPath').findById(this.path);
  
  if (!path) return null;
  
  for (let m = 0; m < path.modules.length; m++) {
    for (let l = 0; l < path.modules[m].lessons.length; l++) {
      const isCompleted = this.progress.completedLessons.some(
        lesson => lesson.moduleIndex === m && lesson.lessonIndex === l
      );
      
      if (!isCompleted) {
        return {
          moduleIndex: m,
          lessonIndex: l,
          module: path.modules[m],
          lesson: path.modules[m].lessons[l]
        };
      }
    }
  }
  
  return null; // All completed
};

const PathEnrollment = mongoose.model('PathEnrollment', pathEnrollmentSchema);

module.exports = PathEnrollment;