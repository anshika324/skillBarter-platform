const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  metrics: {
    // User Metrics
    totalUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    
    // Skill Metrics
    totalSkills: { type: Number, default: 0 },
    newSkills: { type: Number, default: 0 },
    activeSkills: { type: Number, default: 0 },
    topCategories: [{
      category: String,
      count: Number
    }],
    
    // Booking Metrics
    totalBookings: { type: Number, default: 0 },
    newBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    bookingValue: { type: Number, default: 0 }, // Total credits exchanged
    averageBookingDuration: { type: Number, default: 0 },
    
    // Credit Metrics
    totalCreditsInCirculation: { type: Number, default: 0 },
    creditsEarned: { type: Number, default: 0 },
    creditsSpent: { type: Number, default: 0 },
    averageCreditsPerUser: { type: Number, default: 0 },
    
    // Engagement Metrics
    totalSessions: { type: Number, default: 0 },
    totalHoursLearning: { type: Number, default: 0 },
    totalHoursTeaching: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 },
    
    // Review Metrics
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    
    // Message Metrics
    totalMessages: { type: Number, default: 0 },
    activeConversations: { type: Number, default: 0 },
    
    // Growth Metrics
    userGrowthRate: { type: Number, default: 0 }, // Percentage
    bookingGrowthRate: { type: Number, default: 0 },
    revenueGrowthRate: { type: Number, default: 0 }
  },
  
  // Top Performers
  topTeachers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionsCompleted: Number,
    rating: Number
  }],
  
  topLearners: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sessionsCompleted: Number,
    hoursLearned: Number
  }],
  
  topSkills: [{
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    bookings: Number,
    rating: Number
  }]
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ date: -1, period: 1 });
analyticsSchema.index({ period: 1, createdAt: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;