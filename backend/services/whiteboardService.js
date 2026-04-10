const Whiteboard = require('../models/Whiteboard');
const crypto = require('crypto');

class WhiteboardService {
  
  // Generate unique room ID
  static generateRoomId() {
    return `wb_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  // Create whiteboard
  static async createWhiteboard(data, creatorId) {
    try {
      const whiteboard = new Whiteboard({
        ...data,
        creator: creatorId,
        roomId: this.generateRoomId(),
        layers: [
          { name: 'Background', locked: true },
          { name: 'Layer 1' }
        ]
      });
      
      // Add creator as collaborator
      whiteboard.addCollaborator(creatorId, 'owner');
      
      await whiteboard.save();
      return whiteboard;
    } catch (error) {
      console.error('Error creating whiteboard:', error);
      throw error;
    }
  }

  // Get whiteboard by ID or roomId
  static async getWhiteboard(identifier) {
    try {
      const query = identifier.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: identifier }
        : { roomId: identifier };
      
      const whiteboard = await Whiteboard.findOne(query)
        .populate('creator', 'firstName lastName avatar')
        .populate('collaborators.user', 'firstName lastName avatar');
      
      return whiteboard;
    } catch (error) {
      console.error('Error getting whiteboard:', error);
      throw error;
    }
  }

  // Get user's whiteboards
  static async getUserWhiteboards(userId, status = 'active') {
    try {
      const whiteboards = await Whiteboard.find({
        $or: [
          { creator: userId },
          { 'collaborators.user': userId }
        ],
        status
      })
        .populate('creator', 'firstName lastName avatar')
        .sort('-updatedAt');
      
      return whiteboards;
    } catch (error) {
      console.error('Error getting user whiteboards:', error);
      throw error;
    }
  }

  // Join whiteboard
  static async joinWhiteboard(roomId, userId, role = 'editor') {
    try {
      const whiteboard = await this.getWhiteboard(roomId);
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      whiteboard.addCollaborator(userId, role);
      whiteboard.stats.views += 1;
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error joining whiteboard:', error);
      throw error;
    }
  }

  // Add element
  static async addElement(roomId, element, userId) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      element.createdBy = userId;
      whiteboard.addElement(element);
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error adding element:', error);
      throw error;
    }
  }

  // Update element
  static async updateElement(roomId, elementId, updates, userId) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      const element = whiteboard.updateElement(elementId, updates);
      
      if (!element) {
        throw new Error('Element not found');
      }
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error updating element:', error);
      throw error;
    }
  }

  // Remove element
  static async removeElement(roomId, elementId) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      whiteboard.removeElement(elementId);
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error removing element:', error);
      throw error;
    }
  }

  // Clear whiteboard
  static async clearWhiteboard(roomId) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      whiteboard.elements = [];
      whiteboard.stats.edits += 1;
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
      throw error;
    }
  }

  // Update canvas settings
  static async updateCanvas(roomId, settings) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      Object.assign(whiteboard.canvas, settings);
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error updating canvas:', error);
      throw error;
    }
  }

  // Add layer
  static async addLayer(roomId, layer) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      whiteboard.layers.push({
        name: layer.name || `Layer ${whiteboard.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1
      });
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error adding layer:', error);
      throw error;
    }
  }

  // Update layer
  static async updateLayer(roomId, layerIndex, updates) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      if (whiteboard.layers[layerIndex]) {
        Object.assign(whiteboard.layers[layerIndex], updates);
        await whiteboard.save();
      }
      
      return whiteboard;
    } catch (error) {
      console.error('Error updating layer:', error);
      throw error;
    }
  }

  // Create snapshot
  static async createSnapshot(roomId, userId, imageData) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      await whiteboard.createSnapshot(userId, imageData);
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  // Export whiteboard
  static async exportWhiteboard(roomId, format, url) {
    try {
      const whiteboard = await Whiteboard.findOne({ roomId });
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      whiteboard.exports.push({
        format,
        url,
        createdAt: new Date()
      });
      
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error exporting whiteboard:', error);
      throw error;
    }
  }

  // Delete whiteboard
  static async deleteWhiteboard(whiteboardId, userId) {
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId);
      
      if (!whiteboard) {
        throw new Error('Whiteboard not found');
      }
      
      if (whiteboard.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized');
      }
      
      whiteboard.status = 'deleted';
      await whiteboard.save();
      
      return whiteboard;
    } catch (error) {
      console.error('Error deleting whiteboard:', error);
      throw error;
    }
  }

  // Get templates
  static getTemplates() {
    return [
      {
        id: 'blank',
        name: 'Blank Canvas',
        description: 'Start with a clean slate',
        preview: '/templates/blank.png'
      },
      {
        id: 'grid',
        name: 'Grid',
        description: 'Grid background for alignment',
        preview: '/templates/grid.png'
      },
      {
        id: 'dots',
        name: 'Dot Grid',
        description: 'Dot pattern background',
        preview: '/templates/dots.png'
      },
      {
        id: 'kanban',
        name: 'Kanban Board',
        description: 'Task management board',
        preview: '/templates/kanban.png'
      },
      {
        id: 'mindmap',
        name: 'Mind Map',
        description: 'Brainstorming template',
        preview: '/templates/mindmap.png'
      },
      {
        id: 'flowchart',
        name: 'Flowchart',
        description: 'Process diagram template',
        preview: '/templates/flowchart.png'
      },
      {
        id: 'wireframe',
        name: 'Wireframe',
        description: 'UI design template',
        preview: '/templates/wireframe.png'
      }
    ];
  }
}

module.exports = WhiteboardService;