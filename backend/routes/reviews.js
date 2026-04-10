const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

// Create review
router.post('/', auth, async (req, res) => {
  try {
    const { bookingId, rating, comment, aspects, wouldRecommend } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only students can leave reviews' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    const review = new Review({
      booking: bookingId,
      skill: booking.skill,
      provider: booking.provider,
      reviewer: req.user._id,
      rating,
      comment,
      aspects,
      wouldRecommend
    });

    await review.save();

    // Update provider rating
    await updateProviderRating(booking.provider);

    // Update skill rating
    await updateSkillRating(booking.skill);

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'firstName lastName avatar')
      .populate('provider', 'firstName lastName')
      .populate('skill', 'title');

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews for a skill
router.get('/skill/:skillId', async (req, res) => {
  try {
    const reviews = await Review.find({ skill: req.params.skillId })
      .populate('reviewer', 'firstName lastName avatar')
      .sort('-createdAt');

    res.json(reviews);
  } catch (error) {
    console.error('Get skill reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews for a user (as provider)
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.userId })
      .populate('reviewer', 'firstName lastName avatar')
      .populate('skill', 'title')
      .sort('-createdAt');

    res.json({ reviews, total: reviews.length });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to update provider rating
async function updateProviderRating(providerId) {
  const reviews = await Review.find({ provider: providerId });
  
  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await User.findByIdAndUpdate(providerId, {
    rating: {
      average: averageRating,
      count: reviews.length
    }
  });
}

// Helper function to update skill rating
async function updateSkillRating(skillId) {
  const reviews = await Review.find({ skill: skillId });
  
  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await Skill.findByIdAndUpdate(skillId, {
    rating: {
      average: averageRating,
      count: reviews.length
    }
  });
}

module.exports = router;