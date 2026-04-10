const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  aspects: {
    communication: { type: Number, min: 1, max: 5 },
    expertise: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    helpfulness: { type: Number, min: 1, max: 5 }
  },
  wouldRecommend: { type: Boolean, default: true }
}, {
  timestamps: true
});

reviewSchema.index({ skill: 1 });
reviewSchema.index({ provider: 1 });

module.exports = mongoose.model('Review', reviewSchema);