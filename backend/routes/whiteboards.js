const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WhiteboardService = require('../services/whiteboardService');

// Create whiteboard
router.post('/', auth, async (req, res) => {
  try {
    const whiteboard = await WhiteboardService.createWhiteboard(req.body, req.user._id);
    res.status(201).json(whiteboard);
  } catch (error) {
    console.error('Create whiteboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get whiteboard by ID or roomId
router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const whiteboard = await WhiteboardService.getWhiteboard(identifier);
    
    if (!whiteboard) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Get whiteboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's whiteboards
router.get('/my/whiteboards', auth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const whiteboards = await WhiteboardService.getUserWhiteboards(req.user._id, status);
    
    res.json(whiteboards);
  } catch (error) {
    console.error('Get user whiteboards error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join whiteboard
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { role = 'editor' } = req.body;
    
    const whiteboard = await WhiteboardService.joinWhiteboard(roomId, req.user._id, role);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Join whiteboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add element
router.post('/:roomId/elements', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const element = req.body;
    
    const whiteboard = await WhiteboardService.addElement(roomId, element, req.user._id);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Add element error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update element
router.put('/:roomId/elements/:elementId', auth, async (req, res) => {
  try {
    const { roomId, elementId } = req.params;
    const updates = req.body;
    
    const whiteboard = await WhiteboardService.updateElement(roomId, elementId, updates, req.user._id);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Update element error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove element
router.delete('/:roomId/elements/:elementId', auth, async (req, res) => {
  try {
    const { roomId, elementId } = req.params;
    
    const whiteboard = await WhiteboardService.removeElement(roomId, elementId);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Remove element error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear whiteboard
router.post('/:roomId/clear', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const whiteboard = await WhiteboardService.clearWhiteboard(roomId);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Clear whiteboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update canvas settings
router.put('/:roomId/canvas', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const settings = req.body;
    
    const whiteboard = await WhiteboardService.updateCanvas(roomId, settings);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Update canvas error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add layer
router.post('/:roomId/layers', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const layer = req.body;
    
    const whiteboard = await WhiteboardService.addLayer(roomId, layer);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Add layer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update layer
router.put('/:roomId/layers/:layerIndex', auth, async (req, res) => {
  try {
    const { roomId, layerIndex } = req.params;
    const updates = req.body;
    
    const whiteboard = await WhiteboardService.updateLayer(roomId, parseInt(layerIndex), updates);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Update layer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create snapshot
router.post('/:roomId/snapshot', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { imageData } = req.body;
    
    const whiteboard = await WhiteboardService.createSnapshot(roomId, req.user._id, imageData);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Create snapshot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export whiteboard
router.post('/:roomId/export', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { format, url } = req.body;
    
    const whiteboard = await WhiteboardService.exportWhiteboard(roomId, format, url);
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Export whiteboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete whiteboard
router.delete('/:whiteboardId', auth, async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    
    const whiteboard = await WhiteboardService.deleteWhiteboard(whiteboardId, req.user._id);
    
    res.json({ message: 'Whiteboard deleted' });
  } catch (error) {
    console.error('Delete whiteboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get templates
router.get('/meta/templates', (req, res) => {
  try {
    const templates = WhiteboardService.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;