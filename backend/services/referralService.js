const Referral = require('../models/Referral');
const AffiliateProgram = require('../models/AffiliateProgram');
const User = require('../models/User');
const crypto = require('crypto');

class ReferralService {
  
  // Generate unique referral code
  static generateReferralCode(firstName, lastName) {
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${initials}${random}`;
  }

  // Create affiliate program for user
  static async createAffiliateProgram(userId, firstName, lastName) {
    try {
      // Check if already exists
      let affiliate = await AffiliateProgram.findOne({ user: userId });
      if (affiliate) {
        return affiliate;
      }

      // Generate unique referral code
      let referralCode;
      let isUnique = false;
      
      while (!isUnique) {
        referralCode = this.generateReferralCode(firstName, lastName);
        const existing = await AffiliateProgram.findOne({ referralCode });
        if (!existing) {
          isUnique = true;
        }
      }

      // Create affiliate program
      affiliate = await AffiliateProgram.create({
        user: userId,
        referralCode,
        tier: 'bronze',
        stats: {
          totalReferrals: 0,
          activeReferrals: 0,
          totalCreditsEarned: 0
        }
      });

      return affiliate;
    } catch (error) {
      console.error('Error creating affiliate program:', error);
      throw error;
    }
  }

  // Process referral signup
  static async processReferralSignup(referralCode, newUserId) {
    try {
      // Find referrer's affiliate program
      const affiliate = await AffiliateProgram.findOne({ referralCode: referralCode.toUpperCase() });
      if (!affiliate) {
        console.log('Invalid referral code:', referralCode);
        return null;
      }

      // Prevent self-referral
      if (affiliate.user.toString() === newUserId.toString()) {
        console.log('Self-referral is not allowed for user:', newUserId);
        return null;
      }

      // Avoid duplicate referral rows for same referrer-referee pair
      const existingReferral = await Referral.findOne({
        referrer: affiliate.user,
        referee: newUserId
      });
      if (existingReferral) {
        return existingReferral;
      }

      const signupBonusForReferrer = 5;

      // Create referral record
      const referral = await Referral.create({
        referrer: affiliate.user,
        referee: newUserId,
        referralCode,
        status: 'pending',
        milestones: {
          registered: true
        },
        rewards: {
          referrerCredits: signupBonusForReferrer,
          refereeCredits: 0
        }
      });

      // Award referral signup bonus to referrer
      await User.findByIdAndUpdate(affiliate.user, {
        $inc: { timeCredits: signupBonusForReferrer }
      });

      // Track earnings in affiliate stats
      await AffiliateProgram.findByIdAndUpdate(affiliate._id, {
        $inc: {
          'stats.totalCreditsEarned': signupBonusForReferrer
        }
      });

      return referral;
    } catch (error) {
      console.error('Error processing referral signup:', error);
      throw error;
    }
  }

  // Complete milestone and award rewards
  static async completeMilestone(userId, milestone) {
    try {
      // Find referral where this user is the referee
      const referral = await Referral.findOne({
        referee: userId,
        status: { $in: ['pending', 'completed'] }
      });

      if (!referral || referral.milestones[milestone]) {
        return null;
      }

      // Mark milestone as complete
      referral.milestones[milestone] = true;

      // Reward amounts based on milestone
      const rewards = {
        completedProfile: { referrer: 5, referee: 5 },
        firstSkillCreated: { referrer: 10, referee: 10 },
        firstBooking: { referrer: 15, referee: 0 },
        firstSessionCompleted: { referrer: 20, referee: 10 }
      };

      const reward = rewards[milestone];
      if (reward) {
        // Get affiliate program for bonus multiplier
        const affiliate = await AffiliateProgram.findOne({ user: referral.referrer });
        const multiplier = affiliate?.benefits?.bonusMultiplier || 1;

        const referrerReward = Math.round(reward.referrer * multiplier);
        const refereeReward = reward.referee;

        // Update referral rewards
        referral.rewards.referrerCredits += referrerReward;
        referral.rewards.refereeCredits += refereeReward;

        // Award credits
        if (referrerReward > 0) {
          await User.findByIdAndUpdate(referral.referrer, {
            $inc: { timeCredits: referrerReward }
          });
        }

        if (refereeReward > 0) {
          await User.findByIdAndUpdate(referral.referee, {
            $inc: { timeCredits: refereeReward }
          });
        }

        // Update affiliate stats
        if (affiliate) {
          affiliate.stats.totalCreditsEarned += referrerReward;
          await affiliate.save();
        }

        // Check if all milestones completed
        const allCompleted = Object.values(referral.milestones).every(m => m === true);
        if (allCompleted && referral.status === 'pending') {
          referral.status = 'completed';
          referral.completedAt = new Date();

          // Update affiliate program stats
          if (affiliate) {
            affiliate.stats.totalReferrals += 1;
            affiliate.stats.activeReferrals += 1;
            affiliate.updateTier();
            affiliate.updateConversionRate();
            await affiliate.save();
          }
        }

        await referral.save();
        return { referral, referrerReward, refereeReward };
      }

      return null;
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  // Get referral stats for user
  static async getReferralStats(userId) {
    try {
      const [affiliate, referrals] = await Promise.all([
        AffiliateProgram.findOne({ user: userId })
          .populate('user', 'firstName lastName avatar'),
        Referral.find({ referrer: userId })
          .populate('referee', 'firstName lastName avatar createdAt')
          .sort('-createdAt')
      ]);

      if (!affiliate) {
        return null;
      }

      // Calculate additional stats
      const pending = referrals.filter(r => r.status === 'pending').length;
      const completed = referrals.filter(r => r.status === 'completed').length;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyReferrals = referrals.filter(r => 
        new Date(r.createdAt) >= thisMonth
      ).length;

      return {
        affiliate,
        referrals,
        stats: {
          total: referrals.length,
          pending,
          completed,
          thisMonth: monthlyReferrals
        }
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(limit = 10) {
    try {
      const leaderboard = await AffiliateProgram.find({ isActive: true })
        .sort('-stats.totalReferrals')
        .limit(limit)
        .populate('user', 'firstName lastName avatar')
        .select('user tier stats referralCode');

      return leaderboard
        .filter((item) => item.user)
        .map((item, index) => ({
          rank: index + 1,
          user: item.user,
          tier: item.tier,
          referrals: item.stats.totalReferrals,
          earnings: item.stats.totalCreditsEarned,
          referralCode: item.referralCode
        }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Validate referral code
  static async validateReferralCode(code) {
    try {
      const affiliate = await AffiliateProgram.findOne({ 
        referralCode: code.toUpperCase(),
        isActive: true
      });
      return !!affiliate;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }
}

module.exports = ReferralService;
