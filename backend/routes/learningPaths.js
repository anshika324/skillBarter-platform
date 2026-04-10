const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRoles, resolveUserRole } = require('../middleware/roles');
const LearningPathService = require('../services/learningPathService');
const LearningPath = require('../models/LearningPath');
const PathEnrollment = require('../models/PathEnrollment');

// Get all paths with filters
router.get('/', async (req, res) => {
  try {
    const { category, level, search, featured, page = 1, limit = 12, sort } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (level) filters.level = level;
    if (search) filters.search = search;
    if (featured) filters.isFeatured = featured === 'true';
    if (sort) filters.sort = sort;
    
    const result = await LearningPathService.getPaths(
      filters,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Get paths error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get path by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const path = await LearningPathService.getPath(identifier);
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    
    res.json(path);
  } catch (error) {
    console.error('Get path error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create learning path
router.post('/', auth, requireRoles('creator', 'admin'), async (req, res) => {
  try {
    const path = await LearningPathService.createPath(req.body, req.user._id);
    res.status(201).json(path);
  } catch (error) {
    console.error('Create path error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update learning path
router.put('/:id', auth, requireRoles('creator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const path = await LearningPath.findById(id);
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    
    const userRole = resolveUserRole(req.user);
    const isOwner = path.creator.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    Object.assign(path, req.body);
    path.calculateTotalDuration();
    
    await path.save();
    
    res.json(path);
  } catch (error) {
    console.error('Update path error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete learning path
router.delete('/:id', auth, requireRoles('creator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const path = await LearningPath.findById(id);
    
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }
    
    const userRole = resolveUserRole(req.user);
    const isOwner = path.creator.toString() === req.user._id.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await path.deleteOne();
    
    res.json({ message: 'Learning path deleted' });
  } catch (error) {
    console.error('Delete path error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll in path
router.post('/:pathId/enroll', auth, async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const enrollment = await LearningPathService.enrollInPath(req.user._id, pathId);
    
    res.json(enrollment);
  } catch (error) {
    console.error('Enroll error:', error);
    if (error.message === 'Learning path not found') {
      return res.status(404).json({ message: error.message });
    }

    if (
      error.message.includes('Insufficient credits') ||
      error.message.includes('not available') ||
      error.message.includes('prerequisite')
    ) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my enrollments
router.get('/my/enrollments', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const enrollments = await LearningPathService.getUserEnrollments(req.user._id, status);
    
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get enrollment for specific path
router.get('/:pathId/enrollment', auth, async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const enrollment = await LearningPathService.getEnrollment(req.user._id, pathId);

    // Return null instead of 404 so UI can check enrollment state
    // without noisy browser console errors.
    if (!enrollment) {
      return res.json(null);
    }

    res.json(enrollment);
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete lesson
router.post('/:pathId/lesson/:moduleIndex/:lessonIndex/complete', auth, async (req, res) => {
  try {
    const { pathId, moduleIndex, lessonIndex } = req.params;
    const { score, timeSpent } = req.body;
    
    const result = await LearningPathService.completeLesson(
      req.user._id,
      pathId,
      parseInt(moduleIndex),
      parseInt(lessonIndex),
      { score, timeSpent }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit quiz
router.post('/:pathId/quiz/:moduleIndex/:lessonIndex', auth, async (req, res) => {
  try {
    const { pathId, moduleIndex, lessonIndex } = req.params;
    const { answers } = req.body;
    
    const result = await LearningPathService.submitQuiz(
      req.user._id,
      pathId,
      parseInt(moduleIndex),
      parseInt(lessonIndex),
      answers
    );
    
    res.json(result);
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit project
router.post('/:pathId/project/:moduleIndex/:lessonIndex', auth, async (req, res) => {
  try {
    const { pathId, moduleIndex, lessonIndex } = req.params;
    const { submissionUrl } = req.body;
    
    const enrollment = await LearningPathService.submitProject(
      req.user._id,
      pathId,
      parseInt(moduleIndex),
      parseInt(lessonIndex),
      submissionUrl
    );
    
    res.json(enrollment);
  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add note
router.post('/:pathId/note/:moduleIndex/:lessonIndex', auth, async (req, res) => {
  try {
    const { pathId, moduleIndex, lessonIndex } = req.params;
    const { note } = req.body;
    
    const enrollment = await LearningPathService.addNote(
      req.user._id,
      pathId,
      parseInt(moduleIndex),
      parseInt(lessonIndex),
      note
    );
    
    res.json(enrollment);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle bookmark
router.post('/:pathId/bookmark/:moduleIndex/:lessonIndex', auth, async (req, res) => {
  try {
    const { pathId, moduleIndex, lessonIndex } = req.params;
    
    const enrollment = await LearningPathService.toggleBookmark(
      req.user._id,
      pathId,
      parseInt(moduleIndex),
      parseInt(lessonIndex)
    );
    
    res.json(enrollment);
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit rating
router.post('/:pathId/rating', auth, async (req, res) => {
  try {
    const { pathId } = req.params;
    const { rating, feedback } = req.body;
    
    const enrollment = await LearningPathService.submitRating(
      req.user._id,
      pathId,
      rating,
      feedback
    );
    
    res.json(enrollment);
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recommended paths
router.get('/my/recommended', auth, async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const paths = await LearningPathService.getRecommendedPaths(
      req.user._id,
      parseInt(limit)
    );
    
    res.json(paths);
  } catch (error) {
    console.error('Get recommended error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get path statistics
router.get('/:pathId/stats', async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const stats = await LearningPathService.getPathStats(pathId);
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    await LearningPathService.ensurePublishedPathsSeeded();
    const categories = await LearningPath.distinct('category', { status: 'published' });
    res.json(categories.sort());
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
