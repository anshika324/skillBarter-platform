const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15
  },
  creditsPerHour: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  tags: [String],
  availableDays: [String],
  prerequisites: [String],
  whatYouWillLearn: [String],
  maxStudentsPerSession: {
    type: Number,
    default: 1
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

skillSchema.index({ provider: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ isActive: 1 });

module.exports = mongoose.model('Skill', skillSchema);