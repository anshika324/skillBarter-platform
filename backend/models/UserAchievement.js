const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  notified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isCompleted: 1 });

const UserAchievement = mongoose.models.UserAchievement || mongoose.model('UserAchievement', userAchievementSchema);

module.exports = UserAchievement;
