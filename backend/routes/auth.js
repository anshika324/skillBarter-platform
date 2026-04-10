const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ReferralService = require('../services/referralService');
const auth = require('../middleware/auth');
const { resolveUserRole } = require('../middleware/roles');
const { normalizeMatchmakingPayload } = require('../utils/matchmakingProfile');

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      referralCode,
      role,
      teachingSkills,
      learningSkills,
      matchPreferences,
      teachSkill,
      learnSkill
    } = req.body;

    console.log('📝 Registration request:', { firstName, lastName, email, hasReferralCode: !!referralCode });

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const safeRole = role === 'learner' || role === 'creator' ? role : 'creator';

    const starterTeachingSkills = Array.isArray(teachingSkills) ? [...teachingSkills] : [];
    if (typeof teachSkill === 'string' && teachSkill.trim()) {
      starterTeachingSkills.push({ name: teachSkill });
    }

    const starterLearningSkills = Array.isArray(learningSkills) ? [...learningSkills] : [];
    if (typeof learnSkill === 'string' && learnSkill.trim()) {
      starterLearningSkills.push({
        name: learnSkill,
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        priority: 3
      });
    }

    const hasMatchmakingInput =
      starterTeachingSkills.length > 0 ||
      starterLearningSkills.length > 0 ||
      (matchPreferences && typeof matchPreferences === 'object');

    const matchmakingProfile = hasMatchmakingInput
      ? normalizeMatchmakingPayload({
          teachingSkills: starterTeachingSkills,
          learningSkills: starterLearningSkills,
          matchPreferences
        })
      : {};

    // Create user
    const userPayload = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      timeCredits: 5, // Initial credits for new users
      role: safeRole
    };

    user = new User({
      ...userPayload,
      ...matchmakingProfile
    });

    await user.save();
    console.log('✅ User created:', user._id);

    // ✅ CREATE AFFILIATE PROGRAM FOR NEW USER
    try {
      await ReferralService.createAffiliateProgram(
        user._id,
        user.firstName,
        user.lastName
      );
      console.log('✅ Affiliate program created for user:', user._id);
    } catch (error) {
      console.error('❌ Error creating affiliate program:', error);
      // Don't fail registration if this fails
    }

    // ✅ PROCESS REFERRAL IF CODE PROVIDED
    if (referralCode && referralCode.trim()) {
      try {
        console.log('🔗 Processing referral with code:', referralCode);
        const referral = await ReferralService.processReferralSignup(referralCode.toUpperCase(), user._id);
        if (referral) {
          console.log('✅ Referral processed successfully');
          console.log('   - Referral ID:', referral._id);
          console.log('   - Referee credits awarded:', referral.rewards.refereeCredits);
        } else {
          console.log('⚠️ Referral code not found or invalid:', referralCode);
        }
      } catch (error) {
        console.error('❌ Error processing referral:', error);
        // Don't fail registration if this fails
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Refresh user data to get updated credits
    const updatedUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      token,
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        timeCredits: updatedUser.timeCredits,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        teachingSkills: updatedUser.teachingSkills || [],
        learningSkills: updatedUser.learningSkills || [],
        matchPreferences: updatedUser.matchPreferences || {},
        matchProfileCompleted: Boolean(updatedUser.matchProfileCompleted)
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password. Support legacy plain-text rows and auto-migrate them.
    let isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch && user.password === password) {
      user.password = password;
      await user.save();
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active
    user.lastActive = new Date();
    const resolvedRole = resolveUserRole(user);
    if (!user.role) {
      user.role = resolvedRole;
    }
    await user.save();

    // Generate token
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        timeCredits: user.timeCredits,
        avatar: user.avatar,
        bio: user.bio,
        role: resolvedRole,
        teachingSkills: user.teachingSkills || [],
        learningSkills: user.learningSkills || [],
        matchPreferences: user.matchPreferences || {},
        matchProfileCompleted: Boolean(user.matchProfileCompleted)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
