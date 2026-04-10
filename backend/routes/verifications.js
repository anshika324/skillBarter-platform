const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VerificationService = require('../services/verificationService');
const SkillVerification = require('../models/SkillVerification');
const Certificate = require('../models/Certificate');

// Get quiz questions for a skill
router.get('/quiz/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const Skill = require('../models/Skill');
    
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const { technicalQuestions, professionalQuestions } = VerificationService.generateQuiz(skill);
    
    // Remove correct answers before sending to client
    const clientQuestions = technicalQuestions.map(({ correctAnswer, ...q }) => q);
    const clientProfessionalQuestions = professionalQuestions.map(({ correctAnswer, ...q }) => q);
    
    res.json({ questions: clientQuestions, professionalQuestions: clientProfessionalQuestions });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit quiz
router.post('/quiz/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required' });
    }

    const verification = await VerificationService.submitQuiz(
      req.user._id,
      skillId,
      answers
    );

    await verification.populate('skill');

    res.json({
      verification,
      passed: verification.quiz.passed,
      score: verification.quiz.score
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request peer review
router.post('/peer-review/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;

    const verification = await VerificationService.requestPeerReview(
      req.user._id,
      skillId
    );

    await verification.populate('skill');

    res.json(verification);
  } catch (error) {
    console.error('Request peer review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit peer review
router.post('/peer-review/:verificationId/review', auth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const verification = await VerificationService.submitPeerReview(
      verificationId,
      req.user._id,
      rating,
      feedback
    );

    await verification.populate('skill peerReview.reviewers.user');

    res.json(verification);
  } catch (error) {
    console.error('Submit peer review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit portfolio
router.post('/portfolio/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;
    const { portfolioItems } = req.body;

    if (!portfolioItems || !Array.isArray(portfolioItems)) {
      return res.status(400).json({ message: 'Portfolio items are required' });
    }

    const verification = await VerificationService.submitPortfolio(
      req.user._id,
      skillId,
      portfolioItems
    );

    await verification.populate('skill');

    res.json(verification);
  } catch (error) {
    console.error('Submit portfolio error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add endorsement
router.post('/endorse/:userId/:skillId', auth, async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    const { message, relationship } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot endorse yourself' });
    }

    const verification = await VerificationService.addEndorsement(
      userId,
      skillId,
      req.user._id,
      message,
      relationship
    );

    await verification.populate('skill endorsements.user');

    res.json(verification);
  } catch (error) {
    console.error('Add endorsement error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my verifications
router.get('/my-verifications', auth, async (req, res) => {
  try {
    const verifications = await VerificationService.getUserVerifications(req.user._id);
    res.json(verifications);
  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my certificates
router.get('/my-certificates', auth, async (req, res) => {
  try {
    const certificates = await VerificationService.getUserCertificates(req.user._id);
    res.json(certificates);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific certificate
router.get('/certificate/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await Certificate.findOne({ certificateId })
      .populate('skill user');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify certificate authenticity
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const result = await VerificationService.verifyCertificate(certificateId);
    
    res.json(result);
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending reviews (for users to review others)
router.get('/pending-reviews', auth, async (req, res) => {
  try {
    const pendingReviews = await SkillVerification.find({
      verificationMethod: 'peer_review',
      status: { $in: ['pending', 'in_review'] },
      user: { $ne: req.user._id },
      'peerReview.reviewers.user': { $ne: req.user._id }
    })
      .populate('user skill')
      .limit(10);

    res.json(pendingReviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get verification stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [verifications, certificates] = await Promise.all([
      SkillVerification.countDocuments({ user: req.user._id }),
      Certificate.countDocuments({ user: req.user._id, isRevoked: false })
    ]);

    const verifiedCount = await SkillVerification.countDocuments({
      user: req.user._id,
      status: 'verified'
    });

    const pendingCount = await SkillVerification.countDocuments({
      user: req.user._id,
      status: { $in: ['pending', 'in_review'] }
    });

    res.json({
      total: verifications,
      verified: verifiedCount,
      pending: pendingCount,
      certificates: certificates
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
