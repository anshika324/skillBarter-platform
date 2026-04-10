const mongoose = require('mongoose');

const affiliateProgramSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Unique referral code for this user
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  
  // Affiliate tier
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  
  // Stats
  stats: {
    totalReferrals: {
      type: Number,
      default: 0
    },
    activeReferrals: {
      type: Number,
      default: 0
    },
    totalCreditsEarned: {
      type: Number,
      default: 0
    },
    totalBookingsFromReferrals: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Benefits based on tier
  benefits: {
    referralBonus: {
      type: Number,
      default: 10 // Bronze: 10 credits per referral
    },
    commissionRate: {
      type: Number,
      default: 0 // Bronze: 0%, Silver: 5%, Gold: 10%, Platinum: 15%
    },
    bonusMultiplier: {
      type: Number,
      default: 1 // Bronze: 1x, Silver: 1.5x, Gold: 2x, Platinum: 3x
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customReferralLink: {
      type: Boolean,
      default: false
    }
  },
  
  // Milestones for tier upgrades
  tierProgress: {
    bronze: {
      required: { type: Number, default: 0 },
      achieved: { type: Boolean, default: true }
    },
    silver: {
      required: { type: Number, default: 5 },
      achieved: { type: Boolean, default: false }
    },
    gold: {
      required: { type: Number, default: 25 },
      achieved: { type: Boolean, default: false }
    },
    platinum: {
      required: { type: Number, default: 100 },
      achieved: { type: Boolean, default: false }
    }
  },
  
  // Payout information
  payouts: {
    totalPaid: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    lastPayoutDate: Date
  },
  
  // Performance tracking
  monthlyStats: [{
    month: String, // YYYY-MM
    referrals: Number,
    earnings: Number,
    conversions: Number
  }],
  
  // Active status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update tier based on total referrals
affiliateProgramSchema.methods.updateTier = function() {
  const referrals = this.stats.totalReferrals;
  
  let newTier = 'bronze';
  let benefits = {
    referralBonus: 10,
    commissionRate: 0,
    bonusMultiplier: 1,
    prioritySupport: false,
    customReferralLink: false
  };
  
  if (referrals >= 100) {
    newTier = 'platinum';
    benefits = {
      referralBonus: 50,
      commissionRate: 15,
      bonusMultiplier: 3,
      prioritySupport: true,
      customReferralLink: true
    };
    this.tierProgress.platinum.achieved = true;
  } else if (referrals >= 25) {
    newTier = 'gold';
    benefits = {
      referralBonus: 30,
      commissionRate: 10,
      bonusMultiplier: 2,
      prioritySupport: true,
      customReferralLink: true
    };
    this.tierProgress.gold.achieved = true;
  } else if (referrals >= 5) {
    newTier = 'silver';
    benefits = {
      referralBonus: 20,
      commissionRate: 5,
      bonusMultiplier: 1.5,
      prioritySupport: false,
      customReferralLink: false
    };
    this.tierProgress.silver.achieved = true;
  }
  
  this.tier = newTier;
  this.benefits = benefits;
};

// Calculate conversion rate
affiliateProgramSchema.methods.updateConversionRate = function() {
  if (this.stats.totalReferrals > 0) {
    this.stats.conversionRate = Math.round(
      (this.stats.activeReferrals / this.stats.totalReferrals) * 100
    );
  }
};

const AffiliateProgram = mongoose.model('AffiliateProgram', affiliateProgramSchema);

module.exports = AffiliateProgram;