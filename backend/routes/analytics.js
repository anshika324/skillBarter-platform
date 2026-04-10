const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AnalyticsService = require('../services/analyticsService');
const Analytics = require('../models/Analytics');

// Get dashboard stats (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const stats = await AnalyticsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics by date range
router.get('/range', auth, async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const analytics = await AnalyticsService.getAnalyticsByDateRange(
      new Date(startDate),
      new Date(endDate),
      period
    );

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics by range error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user personal analytics
router.get('/user', auth, async (req, res) => {
  try {
    const analytics = await AnalyticsService.getUserAnalytics(req.user._id);
    res.json(analytics);
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific user analytics (admin)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const analytics = await AnalyticsService.getUserAnalytics(req.params.userId);
    res.json(analytics);
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate analytics manually (admin/cron)
router.post('/generate', async (req, res) => {
  try {
    const { date, period = 'daily' } = req.body;
    
    const analytics = await AnalyticsService.generateAnalytics(
      date ? new Date(date) : new Date(),
      period
    );

    res.json({
      message: 'Analytics generated successfully',
      analytics
    });
  } catch (error) {
    console.error('Generate analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get latest analytics by period
router.get('/latest/:period', auth, async (req, res) => {
  try {
    const { period } = req.params;
    
    const analytics = await Analytics.findOne({ period })
      .sort({ date: -1 })
      .populate('topTeachers.userId', 'firstName lastName avatar')
      .populate('topLearners.userId', 'firstName lastName avatar')
      .populate('topSkills.skillId', 'title category');

    if (!analytics) {
      return res.status(404).json({ message: 'No analytics found for this period' });
    }

    res.json(analytics);
  } catch (error) {
    console.error('Get latest analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chart data for specific metric
router.get('/chart/:metric', auth, async (req, res) => {
  try {
    const { metric } = req.params;
    const { period = 'daily', limit = 30 } = req.query;

    const analytics = await Analytics.find({ period })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .select(`date metrics.${metric}`);

    const chartData = analytics.reverse().map(a => ({
      date: a.date,
      value: a.metrics[metric] || 0
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;