const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['teaching', 'learning', 'social', 'milestone', 'special'],
    required: true
  },
  criteria: {
    metric: {
      type: String,
      enum: ['sessionsCompleted', 'hoursTeaching', 'hoursLearning', 'rating', 'reviews', 'streak', 'referrals', 'skillsOffered', 'creditsEarned'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    }
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  reward: {
    credits: {
      type: Number,
      default: 0
    },
    badgeColor: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;