const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Message = require('../models/Message');
const UserStats = require('../models/UserStats');

class AnalyticsService {
  
  // Generate analytics for a specific date and period
  static async generateAnalytics(date = new Date(), period = 'daily') {
    try {
      const startDate = this.getStartDate(date, period);
      const endDate = this.getEndDate(date, period);
      const previousStartDate = this.getPreviousStartDate(startDate, period);

      console.log(`📊 Generating ${period} analytics for ${startDate.toISOString()}`);

      // Compute all metrics
      const metrics = await this.computeMetrics(startDate, endDate, previousStartDate);
      const topPerformers = await this.getTopPerformers(startDate, endDate);

      // Save or update analytics
      const analytics = await Analytics.findOneAndUpdate(
        { date: startDate, period },
        {
          date: startDate,
          period,
          metrics,
          ...topPerformers
        },
        { upsert: true, new: true }
      );

      console.log('✅ Analytics generated successfully');
      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw error;
    }
  }

  // Compute all metrics
  static async computeMetrics(startDate, endDate, previousStartDate) {
    const [
      userMetrics,
      skillMetrics,
      bookingMetrics,
      creditMetrics,
      engagementMetrics,
      reviewMetrics,
      messageMetrics
    ] = await Promise.all([
      this.getUserMetrics(startDate, endDate, previousStartDate),
      this.getSkillMetrics(startDate, endDate),
      this.getBookingMetrics(startDate, endDate, previousStartDate),
      this.getCreditMetrics(startDate, endDate),
      this.getEngagementMetrics(startDate, endDate),
      this.getReviewMetrics(startDate, endDate),
      this.getMessageMetrics(startDate, endDate)
    ]);

    return {
      ...userMetrics,
      ...skillMetrics,
      ...bookingMetrics,
      ...creditMetrics,
      ...engagementMetrics,
      ...reviewMetrics,
      ...messageMetrics
    };
  }

  // User Metrics
  static async getUserMetrics(startDate, endDate, previousStartDate) {
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: startDate, $lt: endDate }
    });
    
    const previousNewUsers = await User.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });
    
    const userGrowthRate = previousNewUsers > 0 
      ? ((newUsers - previousNewUsers) / previousNewUsers * 100)
      : 0;

    return {
      totalUsers,
      newUsers,
      activeUsers,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100
    };
  }

  // Skill Metrics
  static async getSkillMetrics(startDate, endDate) {
    const totalSkills = await Skill.countDocuments({ isActive: true });
    const newSkills = await Skill.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      isActive: true
    });
    const activeSkills = await Skill.countDocuments({
      isActive: true,
      totalBookings: { $gt: 0 }
    });

    // Top categories
    const categoryAgg = await Skill.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    return {
      totalSkills,
      newSkills,
      activeSkills,
      topCategories: categoryAgg
    };
  }

  // Booking Metrics
  static async getBookingMetrics(startDate, endDate, previousStartDate) {
    const totalBookings = await Booking.countDocuments();
    const newBookings = await Booking.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    const completedBookings = await Booking.countDocuments({
      status: 'completed',
      completedAt: { $gte: startDate, $lt: endDate }
    });
    const cancelledBookings = await Booking.countDocuments({
      status: 'cancelled',
      createdAt: { $gte: startDate, $lt: endDate }
    });

    // Calculate total credits exchanged
    const bookingValueAgg = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$creditsUsed' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const bookingValue = bookingValueAgg[0]?.totalCredits || 0;
    const averageBookingDuration = Math.round(bookingValueAgg[0]?.avgDuration || 0);

    // Growth rate
    const previousBookings = await Booking.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });
    const bookingGrowthRate = previousBookings > 0
      ? ((newBookings - previousBookings) / previousBookings * 100)
      : 0;

    return {
      totalBookings,
      newBookings,
      completedBookings,
      cancelledBookings,
      bookingValue,
      averageBookingDuration,
      bookingGrowthRate: Math.round(bookingGrowthRate * 100) / 100
    };
  }

  // Credit Metrics
  static async getCreditMetrics(startDate, endDate) {
    const users = await User.find({}, 'timeCredits');
    const totalCreditsInCirculation = users.reduce((sum, user) => sum + user.timeCredits, 0);
    const averageCreditsPerUser = users.length > 0 
      ? Math.round(totalCreditsInCirculation / users.length)
      : 0;

    // Credits earned/spent in period
    const statsAgg = await UserStats.aggregate([
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$totals.creditsEarned' },
          totalSpent: { $sum: '$totals.creditsSpent' }
        }
      }
    ]);

    return {
      totalCreditsInCirculation,
      creditsEarned: statsAgg[0]?.totalEarned || 0,
      creditsSpent: statsAgg[0]?.totalSpent || 0,
      averageCreditsPerUser
    };
  }

  // Engagement Metrics
  static async getEngagementMetrics(startDate, endDate) {
    const statsAgg = await UserStats.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { 
            $sum: { 
              $add: ['$totals.sessionsAsTeacher', '$totals.sessionsAsStudent'] 
            } 
          },
          totalHoursTeaching: { $sum: '$totals.hoursTeaching' },
          totalHoursLearning: { $sum: '$totals.hoursLearning' }
        }
      }
    ]);

    const totalHoursTeaching = Math.round(statsAgg[0]?.totalHoursTeaching || 0);
    const totalHoursLearning = Math.round(statsAgg[0]?.totalHoursLearning || 0);
    const totalSessions = statsAgg[0]?.totalSessions || 0;
    const averageSessionDuration = totalSessions > 0
      ? Math.round(((totalHoursTeaching + totalHoursLearning) / totalSessions) * 60)
      : 0;

    return {
      totalSessions,
      totalHoursTeaching,
      totalHoursLearning,
      averageSessionDuration
    };
  }

  // Review Metrics
  static async getReviewMetrics(startDate, endDate) {
    const totalReviews = await Review.countDocuments();
    
    const ratingAgg = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const averageRating = ratingAgg[0]?.avgRating 
      ? Math.round(ratingAgg[0].avgRating * 10) / 10
      : 0;

    return {
      totalReviews,
      averageRating
    };
  }

  // Message Metrics
  static async getMessageMetrics(startDate, endDate) {
    const totalMessages = await Message.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });

    // Count unique conversations
    const conversationsAgg = await Message.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$conversation' } },
      { $count: 'total' }
    ]);

    const activeConversations = conversationsAgg[0]?.total || 0;

    return {
      totalMessages,
      activeConversations
    };
  }

  // Get top performers
  static async getTopPerformers(startDate, endDate) {
    // Top Teachers
    const topTeachersAgg = await UserStats.aggregate([
      { $sort: { 'totals.sessionsAsTeacher': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$user',
          sessionsCompleted: '$totals.sessionsAsTeacher',
          rating: '$userInfo.rating.average'
        }
      }
    ]);

    // Top Learners
    const topLearnersAgg = await UserStats.aggregate([
      { $sort: { 'totals.hoursLearning': -1 } },
      { $limit: 10 },
      {
        $project: {
          userId: '$user',
          sessionsCompleted: '$totals.sessionsAsStudent',
          hoursLearned: '$totals.hoursLearning'
        }
      }
    ]);

    // Top Skills
    const topSkillsAgg = await Skill.aggregate([
      { $match: { isActive: true } },
      { $sort: { totalBookings: -1 } },
      { $limit: 10 },
      {
        $project: {
          skillId: '$_id',
          bookings: '$totalBookings',
          rating: '$rating.average'
        }
      }
    ]);

    return {
      topTeachers: topTeachersAgg,
      topLearners: topLearnersAgg,
      topSkills: topSkillsAgg
    };
  }

  // Get real-time dashboard stats
  static async getDashboardStats() {
    try {
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      const startOfMonth = new Date(now.setDate(now.getDate() - 30));

      const [todayStats, weekStats, monthStats] = await Promise.all([
        Analytics.findOne({ period: 'daily', date: { $gte: startOfToday } }).sort({ date: -1 }),
        Analytics.findOne({ period: 'weekly', date: { $gte: startOfWeek } }).sort({ date: -1 }),
        Analytics.findOne({ period: 'monthly', date: { $gte: startOfMonth } }).sort({ date: -1 })
      ]);

      // Get current totals
      const currentMetrics = await this.computeMetrics(
        new Date(0), // From beginning
        new Date(), // Until now
        new Date(0)
      );

      return {
        current: currentMetrics,
        today: todayStats?.metrics || {},
        week: weekStats?.metrics || {},
        month: monthStats?.metrics || {}
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Get analytics for date range
  static async getAnalyticsByDateRange(startDate, endDate, period = 'daily') {
    try {
      const analytics = await Analytics.find({
        period,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });

      return analytics;
    } catch (error) {
      console.error('Error getting analytics by date range:', error);
      throw error;
    }
  }

  // Get user personal analytics
  static async getUserAnalytics(userId) {
    try {
      const stats = await UserStats.findOne({ user: userId });
      const bookings = await Booking.find({
        $or: [{ student: userId }, { provider: userId }]
      });

      const asTeacher = bookings.filter(b => 
        b.provider.toString() === userId.toString() && b.status === 'completed'
      );
      const asStudent = bookings.filter(b => 
        b.student.toString() === userId.toString() && b.status === 'completed'
      );

      // Calculate earnings over time
      const earningsOverTime = this.calculateEarningsOverTime(asTeacher);
      const learningProgress = this.calculateLearningProgress(asStudent);

      return {
        stats: stats?.totals || {},
        level: stats?.level || 1,
        experience: stats?.experience || 0,
        badges: stats?.badges?.length || 0,
        asTeacher: {
          sessions: asTeacher.length,
          totalEarnings: asTeacher.reduce((sum, b) => sum + b.creditsUsed, 0),
          earningsOverTime
        },
        asStudent: {
          sessions: asStudent.length,
          totalSpent: asStudent.reduce((sum, b) => sum + b.creditsUsed, 0),
          learningProgress
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Helper: Calculate earnings over time
  static calculateEarningsOverTime(bookings) {
    const monthly = {};
    
    bookings.forEach(booking => {
      const month = booking.completedAt.toISOString().slice(0, 7); // YYYY-MM
      monthly[month] = (monthly[month] || 0) + booking.creditsUsed;
    });

    return Object.entries(monthly).map(([month, earnings]) => ({
      month,
      earnings
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  // Helper: Calculate learning progress
  static calculateLearningProgress(bookings) {
    const skillCategories = {};
    
    bookings.forEach(booking => {
      const category = booking.skill?.category || 'Other';
      skillCategories[category] = (skillCategories[category] || 0) + 1;
    });

    return Object.entries(skillCategories).map(([category, count]) => ({
      category,
      sessions: count
    }));
  }

  // Helper functions for date calculations
  static getStartDate(date, period) {
    const d = new Date(date);
    if (period === 'daily') {
      d.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    }
    return d;
  }

  static getEndDate(date, period) {
    const d = new Date(date);
    if (period === 'daily') {
      d.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      const day = d.getDay();
      d.setDate(d.getDate() - day + 6);
      d.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
      d.setHours(23, 59, 59, 999);
    }
    return d;
  }

  static getPreviousStartDate(startDate, period) {
    const d = new Date(startDate);
    if (period === 'daily') {
      d.setDate(d.getDate() - 1);
    } else if (period === 'weekly') {
      d.setDate(d.getDate() - 7);
    } else if (period === 'monthly') {
      d.setMonth(d.getMonth() - 1);
    }
    return d;
  }
}

module.exports = AnalyticsService;
