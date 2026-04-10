const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GamificationService = require('../services/gamificationservice');
const UserStats = require('../models/UserStats');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = await UserStats.findOne({ user: req.user._id })
      .populate('badges.achievementId');

    if (!stats) {
      stats = await GamificationService.initializeUserStats(req.user._id);
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user achievements
router.get('/achievements', auth, async (req, res) => {
  try {
    let allAchievements = await Achievement.find({ isActive: true });
    if (allAchievements.length === 0) {
      await GamificationService.seedAchievements();
      allAchievements = await Achievement.find({ isActive: true });
    }

    const userAchievements = await UserAchievement.find({ user: req.user._id })
      .populate('achievement')
      .sort({ earnedAt: -1 });

    const achievements = allAchievements.map(achievement => {
      const userAch = userAchievements.find(
        ua => ua.achievement._id.toString() === achievement._id.toString()
      );

      return {
        ...achievement.toObject(),
        isEarned: userAch?.isCompleted || false,
        earnedAt: userAch?.earnedAt,
        progress: userAch?.progress || { current: 0, total: achievement.criteria.threshold }
      };
    });

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'overall', limit = 100 } = req.query;
    const leaderboard = await GamificationService.getLeaderboard(type, parseInt(limit));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user rank
router.get('/rank', auth, async (req, res) => {
  try {
    const stats = await UserStats.findOne({ user: req.user._id });
    
    if (!stats) {
      return res.json({ rank: 0, totalUsers: 0 });
    }

    const totalUsers = await UserStats.countDocuments();
    const usersAbove = await UserStats.countDocuments({
      $or: [
        { level: { $gt: stats.level } },
        { level: stats.level, experience: { $gt: stats.experience } }
      ]
    });

    const rank = usersAbove + 1;

    res.json({
      rank,
      totalUsers,
      level: stats.level,
      experience: stats.experience,
      percentile: Math.round(((totalUsers - rank) / totalUsers) * 100)
    });
  } catch (error) {
    console.error('Get rank error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed achievements (admin only - for development)
router.post('/seed-achievements', async (req, res) => {
  try {
    await GamificationService.seedAchievements();
    res.json({ message: 'Achievements seeded successfully' });
  } catch (error) {
    console.error('Seed achievements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Award experience (for testing - remove in production)
router.post('/award-xp', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const result = await GamificationService.awardExperience(
      req.user._id,
      amount,
      reason || 'Manual award'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Award XP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check achievements manually
router.post('/check-achievements', auth, async (req, res) => {
  try {
    const newAchievements = await GamificationService.checkAchievements(req.user._id);
    
    res.json({
      message: `Found ${newAchievements.length} new achievements`,
      achievements: newAchievements
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
