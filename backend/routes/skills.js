const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const UserStats = require('../models/UserStats');
const GamificationService = require('../services/gamificationservice');
const auth = require('../middleware/auth');
const { requireRoles, resolveUserRole } = require('../middleware/roles');

// Get all skills (public)
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      skillLevel, 
      search, 
      minCredits, 
      maxCredits,
      sort = '-createdAt',
      limit = 20,
      skip = 0 
    } = req.query;

    let query = { isActive: true };

    if (category && category !== 'All Categories') {
      query.category = category;
    }

    if (skillLevel && skillLevel !== 'all') {
      query.skillLevel = skillLevel;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (minCredits || maxCredits) {
      query.creditsPerHour = {};
      if (minCredits) query.creditsPerHour.$gte = parseInt(minCredits);
      if (maxCredits) query.creditsPerHour.$lte = parseInt(maxCredits);
    }

    const skills = await Skill.find(query)
      .populate('provider', 'firstName lastName avatar rating')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Skill.countDocuments(query);

    res.json({
      skills,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get skill by ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('provider', 'firstName lastName avatar bio rating completedSessions');

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json(skill);
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create skill (protected)
router.post('/', auth, requireRoles('creator', 'admin'), async (req, res) => {
  try {
    const skillData = {
      ...req.body,
      provider: req.user._id
    };

    const skill = new Skill(skillData);
    await skill.save();

    try {
      await syncSkillsOfferedCount(req.user._id);
    } catch (gamificationError) {
      console.error('Gamification sync error (create skill):', gamificationError);
    }

    const populatedSkill = await Skill.findById(skill._id)
      .populate('provider', 'firstName lastName avatar rating');

    res.status(201).json(populatedSkill);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update skill (protected)
router.put('/:id', auth, requireRoles('creator', 'admin'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const userRole = resolveUserRole(req.user);
    const isOwner = skill.provider.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this skill' });
    }

    Object.assign(skill, req.body);
    await skill.save();

    try {
      await syncSkillsOfferedCount(req.user._id);
    } catch (gamificationError) {
      console.error('Gamification sync error (update skill):', gamificationError);
    }

    const populatedSkill = await Skill.findById(skill._id)
      .populate('provider', 'firstName lastName avatar rating');

    res.json(populatedSkill);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete skill (protected)
router.delete('/:id', auth, requireRoles('creator', 'admin'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const userRole = resolveUserRole(req.user);
    const isOwner = skill.provider.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this skill' });
    }

    await skill.deleteOne();

    try {
      await syncSkillsOfferedCount(req.user._id);
    } catch (gamificationError) {
      console.error('Gamification sync error (delete skill):', gamificationError);
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get skills by user
router.get('/user/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ 
      provider: req.params.userId,
      isActive: true 
    })
      .populate('provider', 'firstName lastName avatar rating')
      .sort('-createdAt');

    res.json(skills);
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get skill recommendations (AI-powered)
router.get('/recommendations/for-you', auth, async (req, res) => {
  try {
    // Simple recommendation: skills in categories user is interested in
    const skills = await Skill.find({ 
      isActive: true,
      provider: { $ne: req.user._id }
    })
      .populate('provider', 'firstName lastName avatar rating')
      .sort('-rating.average -totalBookings')
      .limit(10);

    res.json(skills);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

async function syncSkillsOfferedCount(userId) {
  const activeSkillsCount = await Skill.countDocuments({
    provider: userId,
    isActive: true
  });

  let stats = await UserStats.findOne({ user: userId });
  if (!stats) {
    stats = await GamificationService.initializeUserStats(userId);
  }

  stats.totals.skillsOffered = activeSkillsCount;
  await stats.save();
  await GamificationService.checkAchievements(userId);
}

module.exports = router;
