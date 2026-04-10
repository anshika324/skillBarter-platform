const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');
const GamificationService = require('../services/gamificationservice'); // ✅ Correct case

// Get all bookings for current user
router.get('/', auth, async (req, res) => {
  try {
    const { role, status } = req.query;

    let query = {};

    if (role === 'student') {
      query.student = req.user._id;
    } else if (role === 'provider') {
      query.provider = req.user._id;
    } else {
      query.$or = [
        { student: req.user._id },
        { provider: req.user._id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('student', 'firstName lastName avatar')
      .populate('provider', 'firstName lastName avatar')
      .populate('skill', 'title category duration creditsPerHour')
      .sort('-createdAt');

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { skillId, providerId, scheduledDate, startTime, endTime, duration, notes } = req.body;

    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const creditsNeeded = Math.ceil((duration / 60) * skill.creditsPerHour);

    // Check if user has enough credits
    if (req.user.timeCredits < creditsNeeded) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Create booking
    const booking = new Booking({
      student: req.user._id,
      provider: providerId,
      skill: skillId,
      scheduledDate,
      startTime,
      endTime,
      duration,
      creditsUsed: creditsNeeded,
      notes,
      status: 'pending'
    });

    await booking.save();

    // Deduct credits from student
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { timeCredits: -creditsNeeded }
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('student', 'firstName lastName avatar')
      .populate('provider', 'firstName lastName avatar')
      .populate('skill', 'title category duration');

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Confirm booking (provider only)
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'confirmed';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('student', 'firstName lastName avatar')
      .populate('provider', 'firstName lastName avatar')
      .populate('skill', 'title category duration');

    res.json(populatedBooking);
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete booking (provider only) - ✅ GAMIFICATION INTEGRATED
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Award credits to provider
    await User.findByIdAndUpdate(booking.provider, {
      $inc: { 
        timeCredits: booking.creditsUsed,
        completedSessions: 1
      }
    });

    // Update student's completed sessions
    await User.findByIdAndUpdate(booking.student, {
      $inc: { completedSessions: 1 }
    });

    // Update skill booking count
    await Skill.findByIdAndUpdate(booking.skill, {
      $inc: { totalBookings: 1 }
    });

    // ✅ AWARD EXPERIENCE POINTS - Provider (Teacher)
    try {
      await GamificationService.updateSessionStats(booking.provider, {
        isTeacher: true,
        duration: booking.duration,
        creditsChanged: booking.creditsUsed
      });
    } catch (gamError) {
      console.error('Gamification error (provider):', gamError);
      // Don't fail the request if gamification fails
    }

    // ✅ AWARD EXPERIENCE POINTS - Student (Learner)
    try {
      await GamificationService.updateSessionStats(booking.student, {
        isTeacher: false,
        duration: booking.duration,
        creditsChanged: -booking.creditsUsed
      });
    } catch (gamError) {
      console.error('Gamification error (student):', gamError);
      // Don't fail the request if gamification fails
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('student', 'firstName lastName avatar')
      .populate('provider', 'firstName lastName avatar')
      .populate('skill', 'title category duration');

    res.json(populatedBooking);
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isStudent = booking.student.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();

    if (!isStudent && !isProvider) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check 24-hour cancellation policy
    const scheduledTime = new Date(`${booking.scheduledDate}T${booking.startTime}`);
    const now = new Date();
    const hoursUntilSession = (scheduledTime - now) / (1000 * 60 * 60);

    if (hoursUntilSession < 24 && isStudent) {
      return res.status(400).json({ 
        message: 'Cannot cancel within 24 hours of scheduled session' 
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = req.body.reason;
    await booking.save();

    // Refund credits to student
    await User.findByIdAndUpdate(booking.student, {
      $inc: { timeCredits: booking.creditsUsed }
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('student', 'firstName lastName avatar')
      .populate('provider', 'firstName lastName avatar')
      .populate('skill', 'title category duration');

    res.json(populatedBooking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;