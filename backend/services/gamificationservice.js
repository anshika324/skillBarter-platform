const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const UserStats = require('../models/UserStats');
const User = require('../models/User');

class GamificationService {
  
  // Initialize user stats when they register
  static async initializeUserStats(userId) {
    try {
      const stats = await UserStats.create({
        user: userId,
        level: 1,
        experience: 0
      });
      return stats;
    } catch (error) {
      console.error('Error initializing user stats:', error);
      throw error;
    }
  }

  // Award experience points
  static async awardExperience(userId, amount, reason) {
    try {
      let stats = await UserStats.findOne({ user: userId });
      
      if (!stats) {
        stats = await this.initializeUserStats(userId);
      }

      const result = stats.addExperience(amount);
      await stats.save();

      // Check for achievements
      await this.checkAchievements(userId);

      return {
        ...result,
        currentLevel: stats.level,
        totalExperience: stats.experience,
        experienceToNextLevel: stats.experienceToNextLevel,
        reason
      };
    } catch (error) {
      console.error('Error awarding experience:', error);
      throw error;
    }
  }

  // Update user totals after session
  static async updateSessionStats(userId, sessionData) {
    try {
      let stats = await UserStats.findOne({ user: userId });
      if (!stats) {
        stats = await this.initializeUserStats(userId);
      }

      const { isTeacher, duration, creditsChanged } = sessionData;

      if (isTeacher) {
        stats.totals.sessionsAsTeacher += 1;
        stats.totals.hoursTeaching += duration / 60;
        stats.totals.creditsEarned += creditsChanged;
        
        // Update teaching streak
        this.updateStreak(stats.streaks.teaching);
        
        // Award XP
        await this.awardExperience(userId, duration, 'Teaching session completed');
      } else {
        stats.totals.sessionsAsStudent += 1;
        stats.totals.hoursLearning += duration / 60;
        stats.totals.creditsSpent += Math.abs(creditsChanged);
        
        // Update learning streak
        this.updateStreak(stats.streaks.learning);
        
        // Award XP
        await this.awardExperience(userId, duration / 2, 'Learning session completed');
      }

      await stats.save();
      await this.checkAchievements(userId);

      return stats;
    } catch (error) {
      console.error('Error updating session stats:', error);
      throw error;
    }
  }

  // Update streak
  static updateStreak(streakObj) {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActivity = streakObj.lastActivity ? 
      new Date(streakObj.lastActivity).setHours(0, 0, 0, 0) : null;

    if (!lastActivity) {
      streakObj.current = 1;
      streakObj.lastActivity = new Date();
    } else {
      const daysDiff = (today - lastActivity) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === 1) {
        // Consecutive day
        streakObj.current += 1;
        streakObj.longest = Math.max(streakObj.current, streakObj.longest);
      } else if (daysDiff > 1) {
        // Streak broken
        streakObj.current = 1;
      }
      // Same day - no change
      
      streakObj.lastActivity = new Date();
    }
  }

  // Check and award achievements
  static async checkAchievements(userId) {
    try {
      const stats = await UserStats.findOne({ user: userId });
      const achievements = await Achievement.find({ isActive: true });
      const userAchievements = await UserAchievement.find({ user: userId });
      
      const earnedIds = new Set(
        userAchievements
          .filter(ua => ua.isCompleted)
          .map(ua => ua.achievement.toString())
      );

      const newAchievements = [];

      for (const achievement of achievements) {
        // Skip if already earned
        if (earnedIds.has(achievement._id.toString())) continue;

        const { metric, threshold } = achievement.criteria;
        let currentValue = 0;

        // Get current value based on metric
        switch (metric) {
          case 'sessionsCompleted':
            currentValue = stats.totals.sessionsAsTeacher + stats.totals.sessionsAsStudent;
            break;
          case 'hoursTeaching':
            currentValue = stats.totals.hoursTeaching;
            break;
          case 'hoursLearning':
            currentValue = stats.totals.hoursLearning;
            break;
          case 'creditsEarned':
            currentValue = stats.totals.creditsEarned;
            break;
          case 'reviews':
            currentValue = stats.totals.reviewsReceived;
            break;
          case 'streak':
            currentValue = Math.max(
              stats.streaks.teaching.current,
              stats.streaks.learning.current
            );
            break;
          case 'referrals':
            currentValue = stats.totals.referralsMade;
            break;
          case 'skillsOffered':
            currentValue = stats.totals.skillsOffered;
            break;
          default:
            continue;
        }

        // Check if achievement is earned
        if (currentValue >= threshold) {
          await UserAchievement.findOneAndUpdate(
            { user: userId, achievement: achievement._id },
            {
              user: userId,
              achievement: achievement._id,
              isCompleted: true,
              earnedAt: new Date(),
              progress: { current: currentValue, total: threshold }
            },
            { upsert: true, new: true }
          );

          // Add badge to user stats
          stats.badges.push({
            achievementId: achievement._id,
            earnedAt: new Date()
          });

          // Award bonus credits
          if (achievement.reward.credits > 0) {
            await User.findByIdAndUpdate(userId, {
              $inc: { timeCredits: achievement.reward.credits }
            });
          }

          newAchievements.push(achievement);
        } else {
          // Update progress
          await UserAchievement.findOneAndUpdate(
            { user: userId, achievement: achievement._id },
            {
              user: userId,
              achievement: achievement._id,
              progress: { current: currentValue, total: threshold }
            },
            { upsert: true }
          );
        }
      }

      await stats.save();

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(type = 'overall', limit = 100) {
    try {
      let sortField;
      
      switch (type) {
        case 'teaching':
          sortField = { 'totals.hoursTeaching': -1 };
          break;
        case 'learning':
          sortField = { 'totals.hoursLearning': -1 };
          break;
        case 'level':
          sortField = { level: -1, experience: -1 };
          break;
        default:
          sortField = { experience: -1 };
      }

      const leaderboard = await UserStats.find()
        .populate('user', 'firstName lastName avatar')
        .sort(sortField)
        .limit(limit);

      return leaderboard
        .filter((stat) => stat.user)
        .map((stat, index) => ({
          rank: index + 1,
          user: stat.user,
          level: stat.level,
          experience: stat.experience,
          stats: stat.totals,
          badges: stat.badges.length
        }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Seed default achievements
  static async seedAchievements() {
    const achievements = [
      // Teaching Achievements
      {
        name: 'First Teacher',
        description: 'Complete your first teaching session',
        icon: '🎓',
        type: 'teaching',
        criteria: { metric: 'sessionsCompleted', threshold: 1 },
        rarity: 'common',
        reward: { credits: 5, badgeColor: '#10B981' }
      },
      {
        name: 'Teaching Veteran',
        description: 'Complete 50 teaching sessions',
        icon: '👨‍🏫',
        type: 'teaching',
        criteria: { metric: 'sessionsCompleted', threshold: 50 },
        rarity: 'rare',
        reward: { credits: 20, badgeColor: '#3B82F6' }
      },
      {
        name: 'Master Teacher',
        description: 'Teach for 100 hours',
        icon: '🏆',
        type: 'teaching',
        criteria: { metric: 'hoursTeaching', threshold: 100 },
        rarity: 'epic',
        reward: { credits: 50, badgeColor: '#8B5CF6' }
      },
      
      // Learning Achievements
      {
        name: 'Eager Learner',
        description: 'Complete your first learning session',
        icon: '📚',
        type: 'learning',
        criteria: { metric: 'sessionsCompleted', threshold: 1 },
        rarity: 'common',
        reward: { credits: 3, badgeColor: '#10B981' }
      },
      {
        name: 'Knowledge Seeker',
        description: 'Learn for 50 hours',
        icon: '🧠',
        type: 'learning',
        criteria: { metric: 'hoursLearning', threshold: 50 },
        rarity: 'rare',
        reward: { credits: 15, badgeColor: '#3B82F6' }
      },
      
      // Streak Achievements
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        type: 'milestone',
        criteria: { metric: 'streak', threshold: 7 },
        rarity: 'rare',
        reward: { credits: 10, badgeColor: '#F59E0B' }
      },
      {
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        type: 'milestone',
        criteria: { metric: 'streak', threshold: 30 },
        rarity: 'legendary',
        reward: { credits: 100, badgeColor: '#EF4444' }
      },
      
      // Credit Achievements
      {
        name: 'Credit Collector',
        description: 'Earn 100 credits',
        icon: '💰',
        type: 'milestone',
        criteria: { metric: 'creditsEarned', threshold: 100 },
        rarity: 'rare',
        reward: { credits: 25, badgeColor: '#F59E0B' }
      },
      
      // Social Achievements
      {
        name: 'Community Builder',
        description: 'Refer 5 friends',
        icon: '🤝',
        type: 'social',
        criteria: { metric: 'referrals', threshold: 5 },
        rarity: 'epic',
        reward: { credits: 30, badgeColor: '#8B5CF6' }
      },
      {
        name: 'Skill Master',
        description: 'Offer 5 different skills',
        icon: '⭐',
        type: 'special',
        criteria: { metric: 'skillsOffered', threshold: 5 },
        rarity: 'epic',
        reward: { credits: 20, badgeColor: '#8B5CF6' }
      }
    ];

    try {
      for (const achievement of achievements) {
        await Achievement.findOneAndUpdate(
          { name: achievement.name },
          achievement,
          { upsert: true, new: true }
        );
      }
      console.log('✅ Achievements seeded successfully');
    } catch (error) {
      console.error('Error seeding achievements:', error);
    }
  }
}

module.exports = GamificationService;
