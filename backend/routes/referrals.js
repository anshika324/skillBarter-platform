const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ReferralService = require('../services/referralService');
const AffiliateProgram = require('../models/AffiliateProgram');
const Referral = require('../models/Referral');

// Get or create user's affiliate program
router.get('/my-program', auth, async (req, res) => {
  try {
    let affiliate = await AffiliateProgram.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email avatar');

    if (!affiliate) {
      affiliate = await ReferralService.createAffiliateProgram(
        req.user._id,
        req.user.firstName,
        req.user.lastName
      );
      affiliate = await AffiliateProgram.findById(affiliate._id)
        .populate('user', 'firstName lastName email avatar');
    }

    res.json(affiliate);
  } catch (error) {
    console.error('Get affiliate program error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await ReferralService.getReferralStats(req.user._id);
    
    if (!stats) {
      return res.status(404).json({ message: 'Affiliate program not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = await ReferralService.getLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate referral code
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const isValid = await ReferralService.validateReferralCode(code);
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete a milestone (called automatically by other services)
router.post('/milestone/:milestone', auth, async (req, res) => {
  try {
    const { milestone } = req.params;
    
    const validMilestones = [
      'completedProfile',
      'firstSkillCreated',
      'firstBooking',
      'firstSessionCompleted'
    ];

    if (!validMilestones.includes(milestone)) {
      return res.status(400).json({ message: 'Invalid milestone' });
    }

    const result = await ReferralService.completeMilestone(req.user._id, milestone);
    
    if (result) {
      res.json({
        message: 'Milestone completed',
        ...result
      });
    } else {
      res.json({ message: 'Milestone already completed or no referral found' });
    }
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my referrals list
router.get('/my-referrals', auth, async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referee', 'firstName lastName avatar createdAt')
      .sort('-createdAt');

    res.json(referrals);
  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tier benefits information
router.get('/tiers', async (req, res) => {
  try {
    const tiers = {
      bronze: {
        name: 'Bronze',
        minReferrals: 0,
        benefits: {
          referralBonus: 10,
          commissionRate: 0,
          bonusMultiplier: 1,
          prioritySupport: false,
          customReferralLink: false
        },
        color: '#CD7F32'
      },
      silver: {
        name: 'Silver',
        minReferrals: 5,
        benefits: {
          referralBonus: 20,
          commissionRate: 5,
          bonusMultiplier: 1.5,
          prioritySupport: false,
          customReferralLink: false
        },
        color: '#C0C0C0'
      },
      gold: {
        name: 'Gold',
        minReferrals: 25,
        benefits: {
          referralBonus: 30,
          commissionRate: 10,
          bonusMultiplier: 2,
          prioritySupport: true,
          customReferralLink: true
        },
        color: '#FFD700'
      },
      platinum: {
        name: 'Platinum',
        minReferrals: 100,
        benefits: {
          referralBonus: 50,
          commissionRate: 15,
          bonusMultiplier: 3,
          prioritySupport: true,
          customReferralLink: true
        },
        color: '#E5E4E2'
      }
    };

    res.json(tiers);
  } catch (error) {
    console.error('Get tiers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;