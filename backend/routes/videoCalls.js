const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VideoCallService = require('../services/videoCallService');

// Create call from booking
router.post('/create/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const call = await VideoCallService.createCallFromBooking(bookingId, req.user._id);
    
    res.json(call);
  } catch (error) {
    console.error('Create call error:', error);
    if (error.message === 'Booking not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Not authorized for this booking call') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Video call is available after booking confirmation') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get call by room ID
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const call = await VideoCallService.getCallByRoomId(roomId);
    
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    res.json(call);
  } catch (error) {
    console.error('Get call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join call
router.post('/join/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { role } = req.body;
    
    const call = await VideoCallService.joinCall(roomId, req.user._id, role);
    
    res.json(call);
  } catch (error) {
    console.error('Join call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave call
router.post('/leave/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const call = await VideoCallService.leaveCall(roomId, req.user._id);
    
    res.json(call);
  } catch (error) {
    console.error('Leave call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add chat message
router.post('/chat/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    
    const chatMessage = await VideoCallService.addChatMessage(roomId, req.user._id, message);
    
    res.json(chatMessage);
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start recording
router.post('/recording/start/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const call = await VideoCallService.startRecording(roomId);
    
    res.json({ message: 'Recording started', call });
  } catch (error) {
    console.error('Start recording error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Stop recording
router.post('/recording/stop/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { recordingUrl, size } = req.body;
    
    const call = await VideoCallService.stopRecording(roomId, recordingUrl, size);
    
    res.json({ message: 'Recording stopped', call });
  } catch (error) {
    console.error('Stop recording error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Report issue
router.post('/issue/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { issueType } = req.body;
    
    const call = await VideoCallService.reportIssue(roomId, req.user._id, issueType);
    
    res.json({ message: 'Issue reported', call });
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle feature
router.post('/feature/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { feature, enabled } = req.body;
    
    const call = await VideoCallService.toggleFeature(roomId, feature, enabled);
    
    res.json(call);
  } catch (error) {
    console.error('Toggle feature error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit feedback
router.post('/feedback/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { rating, comment } = req.body;
    
    const call = await VideoCallService.submitFeedback(roomId, req.user._id, rating, comment);
    
    res.json({ message: 'Feedback submitted', call });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get call history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const calls = await VideoCallService.getCallHistory(
      req.user._id,
      parseInt(limit),
      parseInt(skip)
    );
    
    res.json(calls);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming calls
router.get('/upcoming', auth, async (req, res) => {
  try {
    const calls = await VideoCallService.getUpcomingCalls(req.user._id);
    
    res.json(calls);
  } catch (error) {
    console.error('Get upcoming error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get call stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await VideoCallService.getCallStats(req.user._id);
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
