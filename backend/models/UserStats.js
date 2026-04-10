const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  experienceToNextLevel: {
    type: Number,
    default: 100
  },
  badges: [{
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    earnedAt: Date
  }],
  streaks: {
    teaching: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivity: Date
    },
    learning: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivity: Date
    }
  },
  totals: {
    sessionsAsTeacher: { type: Number, default: 0 },
    sessionsAsStudent: { type: Number, default: 0 },
    hoursTeaching: { type: Number, default: 0 },
    hoursLearning: { type: Number, default: 0 },
    creditsEarned: { type: Number, default: 0 },
    creditsSpent: { type: Number, default: 0 },
    reviewsGiven: { type: Number, default: 0 },
    reviewsReceived: { type: Number, default: 0 },
    referralsMade: { type: Number, default: 0 },
    skillsOffered: { type: Number, default: 0 }
  },
  leaderboard: {
    teachingRank: { type: Number, default: 0 },
    learningRank: { type: Number, default: 0 },
    overallRank: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Calculate level from experience
userStatsSchema.methods.calculateLevel = function() {
  // Level formula: Level = floor(sqrt(experience / 50))
  const newLevel = Math.floor(Math.sqrt(this.experience / 50)) + 1;
  this.level = Math.max(1, newLevel);
  this.experienceToNextLevel = Math.pow(this.level, 2) * 50 - this.experience;
  return this.level;
};

// Add experience and check for level up
userStatsSchema.methods.addExperience = function(amount) {
  const oldLevel = this.level;
  this.experience += amount;
  const newLevel = this.calculateLevel();
  
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    experienceGained: amount
  };
};

userStatsSchema.index({ level: -1, experience: -1 });

const UserStats = mongoose.models.UserStats || mongoose.model('UserStats', userStatsSchema);

module.exports = UserStats;
