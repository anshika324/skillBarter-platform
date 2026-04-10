const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // The user who created the referral (referrer)
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // The user who was referred (referee)
  referee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Unique referral code used
  referralCode: {
    type: String,
    required: true,
    index: true
  },
  
  // Status of the referral
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending'
  },
  
  // Rewards
  rewards: {
    referrerCredits: {
      type: Number,
      default: 0
    },
    refereeCredits: {
      type: Number,
      default: 0
    },
    bonusCredits: {
      type: Number,
      default: 0
    }
  },
  
  // Milestones reached by referee
  milestones: {
    registered: {
      type: Boolean,
      default: false
    },
    completedProfile: {
      type: Boolean,
      default: false
    },
    firstBooking: {
      type: Boolean,
      default: false
    },
    firstSkillCreated: {
      type: Boolean,
      default: false
    },
    firstSessionCompleted: {
      type: Boolean,
      default: false
    }
  },
  
  // Dates
  completedAt: Date,
  rewardedAt: Date
}, {
  timestamps: true
});

// Compound indexes
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referee: 1 });
referralSchema.index({ referralCode: 1, status: 1 });

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;