const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const {
  normalizeSkillToken,
  sanitizeTeachingSkills,
  sanitizeLearningSkills,
  sanitizeMatchPreferences,
  buildLegacySkillsFromTeachingSkills,
  buildLegacyInterestsFromLearningSkills,
  extractMatchmakingSnapshot,
  hasOwn
} = require('../utils/matchmakingProfile');

// Import auth middleware
const auth = require('../middleware/auth');
const { requireRoles, VALID_ROLES } = require('../middleware/roles');

const PROTECTED_FIELDS = ['password', 'email', 'timeCredits', 'role', 'isActive'];

function removeProtectedFields(updates) {
  for (const field of PROTECTED_FIELDS) {
    delete updates[field];
  }
}

function buildProfileUpdates(payload, currentUser) {
  const updates = { ...payload };
  removeProtectedFields(updates);

  const hasTeachingUpdate =
    hasOwn(payload, 'teachingSkills') ||
    hasOwn(payload, 'skillsCanTeach') ||
    hasOwn(payload, 'skills');

  const hasLearningUpdate =
    hasOwn(payload, 'learningSkills') ||
    hasOwn(payload, 'skillsToLearn') ||
    hasOwn(payload, 'interests');

  const hasMatchPreferencesUpdate =
    hasOwn(payload, 'matchPreferences') ||
    hasOwn(payload, 'barterPreferences');

  if (!hasTeachingUpdate && !hasLearningUpdate && !hasMatchPreferencesUpdate) {
    return updates;
  }

  const teachingSource = hasOwn(payload, 'teachingSkills')
    ? payload.teachingSkills
    : hasOwn(payload, 'skillsCanTeach')
      ? payload.skillsCanTeach
      : payload.skills;

  const learningSource = hasOwn(payload, 'learningSkills')
    ? payload.learningSkills
    : hasOwn(payload, 'skillsToLearn')
      ? payload.skillsToLearn
      : payload.interests;

  const matchPreferencesSource = hasOwn(payload, 'matchPreferences')
    ? payload.matchPreferences
    : payload.barterPreferences;

  const teachingSkills = hasTeachingUpdate
    ? sanitizeTeachingSkills(teachingSource || [])
    : currentUser.teachingSkills || [];

  const learningSkills = hasLearningUpdate
    ? sanitizeLearningSkills(learningSource || [])
    : currentUser.learningSkills || [];

  const matchPreferences = hasMatchPreferencesUpdate
    ? sanitizeMatchPreferences(matchPreferencesSource || {})
    : currentUser.matchPreferences || {};

  updates.teachingSkills = teachingSkills;
  updates.learningSkills = learningSkills;
  updates.matchPreferences = matchPreferences;
  updates.matchProfileCompleted = teachingSkills.length > 0 && learningSkills.length > 0;
  updates.matchProfileUpdatedAt = new Date();

  // Keep existing fields aligned for backward compatibility with older features.
  updates.skills = buildLegacySkillsFromTeachingSkills(teachingSkills);
  updates.interests = buildLegacyInterestsFromLearningSkills(learningSkills);

  return updates;
}

async function updateCurrentUserProfile(req, res) {
  try {
    const currentUser = await User.findById(req.user._id).select('-password');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = buildProfileUpdates(req.body, currentUser);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Search users - MUST BE FIRST
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }]
    })
      .sort({ createdAt: -1 })
      .limit(300)
      .populate('sender recipient', 'firstName lastName avatar');

    const partners = new Map();

    for (const msg of messages) {
      const senderId = msg.sender?._id?.toString?.();
      const recipientId = msg.recipient?._id?.toString?.();
      const currentUserId = req.user._id.toString();

      const otherUser = senderId === currentUserId ? msg.recipient : msg.sender;
      const otherUserId = otherUser?._id?.toString?.();
      if (!otherUserId || otherUserId === currentUserId) continue;

      if (!partners.has(otherUserId)) {
        partners.set(otherUserId, {
          ...otherUser.toObject(),
          lastMessageAt: msg.createdAt,
          lastMessage: msg.content
        });
      }
    }

    res.json({ users: Array.from(partners.values()) });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users - MUST BE AFTER /conversations
router.get('/search', auth, async (req, res) => {
  try {
    const { query, teachingSkill, learningSkill, limit = 20, skip = 0 } = req.query;

    const filters = [{ _id: { $ne: req.user._id } }];

    if (query) {
      filters.push({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      });
    }

    if (typeof teachingSkill === 'string' && teachingSkill.trim()) {
      const normalizedTeachingSkill = normalizeSkillToken(teachingSkill);
      filters.push({
        $or: [
          { 'teachingSkills.normalizedName': normalizedTeachingSkill },
          { 'skills.name': { $regex: teachingSkill, $options: 'i' } }
        ]
      });
    }

    if (typeof learningSkill === 'string' && learningSkill.trim()) {
      const normalizedLearningSkill = normalizeSkillToken(learningSkill);
      filters.push({
        $or: [
          { 'learningSkills.normalizedName': normalizedLearningSkill },
          { interests: { $regex: learningSkill, $options: 'i' } }
        ]
      });
    }

    const searchQuery = filters.length > 1 ? { $and: filters } : filters[0];

    const parsedLimit = Number.parseInt(limit, 10);
    const parsedSkip = Number.parseInt(skip, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(Math.min(parsedLimit, 100), 1) : 20;
    const safeSkip = Number.isFinite(parsedSkip) ? Math.max(parsedSkip, 0) : 0;

    const users = await User.find(searchQuery)
      .select('-password')
      .limit(safeLimit)
      .skip(safeSkip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchQuery);

    res.json({
      users,
      total,
      page: Math.floor(safeSkip / safeLimit) + 1,
      totalPages: Math.ceil(total / safeLimit)
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get only matchmaking profile fields for current user
router.get('/matchmaking-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'teachingSkills learningSkills matchPreferences matchProfileCompleted matchProfileUpdatedAt location rating completedSessions isActive'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(extractMatchmakingSnapshot(user));
  } catch (error) {
    console.error('Get matchmaking profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update only matchmaking profile fields
router.put('/matchmaking-profile', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select('-password');
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = {};
    if (hasOwn(req.body, 'teachingSkills')) payload.teachingSkills = req.body.teachingSkills;
    if (hasOwn(req.body, 'learningSkills')) payload.learningSkills = req.body.learningSkills;
    if (hasOwn(req.body, 'matchPreferences')) payload.matchPreferences = req.body.matchPreferences;
    if (hasOwn(req.body, 'skillsCanTeach')) payload.skillsCanTeach = req.body.skillsCanTeach;
    if (hasOwn(req.body, 'skillsToLearn')) payload.skillsToLearn = req.body.skillsToLearn;
    if (hasOwn(req.body, 'interests')) payload.interests = req.body.interests;

    const updates = buildProfileUpdates(payload, currentUser);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(extractMatchmakingSnapshot(user));
  } catch (error) {
    console.error('Update matchmaking profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Profiles dataset for future AI/ML model integration
router.get('/matchmaking/profiles', auth, requireRoles('admin', 'creator'), async (req, res) => {
  try {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(Math.min(parsedLimit, 500), 1) : 200;

    const users = await User.find({ isActive: true, matchProfileCompleted: true })
      .select(
        'teachingSkills learningSkills matchPreferences matchProfileCompleted matchProfileUpdatedAt location rating completedSessions isActive'
      )
      .limit(safeLimit)
      .sort({ matchProfileUpdatedAt: -1 });

    const profiles = users
      .map((entry) => extractMatchmakingSnapshot(entry))
      .filter(Boolean);

    res.json({
      total: profiles.length,
      profiles
    });
  } catch (error) {
    console.error('Get matchmaking dataset error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, updateCurrentUserProfile);
router.put('/', auth, updateCurrentUserProfile);

// Get user by ID - MUST BE AFTER /search and /profile routes
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      completedSessions: user.completedSessions || 0,
      timeCredits: user.timeCredits || 0,
      rating: user.rating || { average: 0, count: 0 },
      joinedDate: user.createdAt,
      skillsOffered: user.teachingSkills?.length || user.skills?.length || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: update user role
router.patch('/:id/role', auth, requireRoles('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: activate/deactivate user
router.patch('/:id/status', auth, requireRoles('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
