// Whiteboard Real-Time Signaling
// Add this to your Socket.IO setup

const WhiteboardService = require('../services/whiteboardService');

function setupWhiteboardSignaling(io) {
  
  // Store active drawing sessions
  const activeBoards = new Map();

  io.on('connection', (socket) => {
    console.log(`Whiteboard: User connected - ${socket.id}`);

    // Join whiteboard room
    socket.on('join-whiteboard', async ({ roomId, userId, userName, userColor }) => {
      try {
        console.log(`${userName} joining whiteboard ${roomId}`);
        
        socket.join(roomId);
        socket.whiteboardRoom = roomId;
        socket.userId = userId;
        socket.userName = userName;
        socket.userColor = userColor;
        
        // Track users in room
        if (!activeBoards.has(roomId)) {
          activeBoards.set(roomId, new Map());
        }
        
        activeBoards.get(roomId).set(socket.id, {
          userId,
          userName,
          userColor,
          cursor: { x: 0, y: 0 }
        });
        
        // Get whiteboard data
        const whiteboard = await WhiteboardService.getWhiteboardByRoomId(roomId);
        
        if (whiteboard) {
          // Add as collaborator
          await WhiteboardService.addCollaborator(whiteboard._id, userId);
          
          // Send current state to new user
          socket.emit('whiteboard-state', {
            elements: whiteboard.elements,
            canvas: whiteboard.canvas
          });
        }
        
        // Notify others
        socket.to(roomId).emit('user-joined-whiteboard', {
          userId,
          userName,
          userColor,
          socketId: socket.id
        });
        
        // Send list of active users
        const users = Array.from(activeBoards.get(roomId).values());
        socket.emit('active-users', users);
        
        console.log(`Whiteboard ${roomId} now has ${activeBoards.get(roomId).size} users`);
      } catch (error) {
        console.error('Join whiteboard error:', error);
        socket.emit('whiteboard-error', { message: 'Failed to join whiteboard' });
      }
    });

    // Drawing events
    socket.on('draw-start', ({ x, y, color, width, tool }) => {
      if (socket.whiteboardRoom) {
        socket.to(socket.whiteboardRoom).emit('remote-draw-start', {
          x, y, color, width, tool,
          userId: socket.userId,
          userName: socket.userName,
          socketId: socket.id
        });
      }
    });

    socket.on('draw-move', ({ x, y }) => {
      if (socket.whiteboardRoom) {
        socket.to(socket.whiteboardRoom).emit('remote-draw-move', {
          x, y,
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });

    socket.on('draw-end', async ({ element }) => {
      if (socket.whiteboardRoom) {
        try {
          // Save element to database
          element.createdBy = socket.userId;
          await WhiteboardService.addElement(socket.whiteboardRoom, element);
          
          // Broadcast to others
          socket.to(socket.whiteboardRoom).emit('remote-draw-end', {
            element,
            userId: socket.userId,
            socketId: socket.id
          });
        } catch (error) {
          console.error('Draw end error:', error);
        }
      }
    });

    // Add shape
    socket.on('add-shape', async ({ shape }) => {
      if (socket.whiteboardRoom) {
        try {
          shape.createdBy = socket.userId;
          await WhiteboardService.addElement(socket.whiteboardRoom, shape);
          
          socket.to(socket.whiteboardRoom).emit('remote-add-shape', {
            shape,
            userId: socket.userId
          });
        } catch (error) {
          console.error('Add shape error:', error);
        }
      }
    });

    // Add text
    socket.on('add-text', async ({ text }) => {
      if (socket.whiteboardRoom) {
        try {
          text.createdBy = socket.userId;
          await WhiteboardService.addElement(socket.whiteboardRoom, text);
          
          socket.to(socket.whiteboardRoom).emit('remote-add-text', {
            text,
            userId: socket.userId
          });
        } catch (error) {
          console.error('Add text error:', error);
        }
      }
    });

    // Update element
    socket.on('update-element', async ({ elementId, updates }) => {
      if (socket.whiteboardRoom) {
        try {
          await WhiteboardService.updateElement(socket.whiteboardRoom, elementId, updates);
          
          socket.to(socket.whiteboardRoom).emit('remote-update-element', {
            elementId,
            updates,
            userId: socket.userId
          });
        } catch (error) {
          console.error('Update element error:', error);
        }
      }
    });

    // Delete element
    socket.on('delete-element', async ({ elementId }) => {
      if (socket.whiteboardRoom) {
        try {
          await WhiteboardService.removeElement(socket.whiteboardRoom, elementId);
          
          socket.to(socket.whiteboardRoom).emit('remote-delete-element', {
            elementId,
            userId: socket.userId
          });
        } catch (error) {
          console.error('Delete element error:', error);
        }
      }
    });

    // Clear board
    socket.on('clear-board', async () => {
      if (socket.whiteboardRoom) {
        try {
          await WhiteboardService.clearWhiteboard(socket.whiteboardRoom, socket.userId);
          
          io.to(socket.whiteboardRoom).emit('board-cleared', {
            userId: socket.userId,
            userName: socket.userName
          });
        } catch (error) {
          console.error('Clear board error:', error);
          socket.emit('whiteboard-error', { message: error.message });
        }
      }
    });

    // Cursor movement
    socket.on('cursor-move', ({ x, y }) => {
      if (socket.whiteboardRoom && activeBoards.has(socket.whiteboardRoom)) {
        const user = activeBoards.get(socket.whiteboardRoom).get(socket.id);
        if (user) {
          user.cursor = { x, y };
          
          socket.to(socket.whiteboardRoom).emit('remote-cursor-move', {
            userId: socket.userId,
            userName: socket.userName,
            userColor: socket.userColor,
            socketId: socket.id,
            x, y
          });
        }
      }
    });

    // Undo
    socket.on('undo', async () => {
      if (socket.whiteboardRoom) {
        socket.to(socket.whiteboardRoom).emit('remote-undo', {
          userId: socket.userId
        });
      }
    });

    // Redo
    socket.on('redo', async () => {
      if (socket.whiteboardRoom) {
        socket.to(socket.whiteboardRoom).emit('remote-redo', {
          userId: socket.userId
        });
      }
    });

    // Change tool
    socket.on('tool-change', ({ tool }) => {
      if (socket.whiteboardRoom) {
        socket.to(socket.whiteboardRoom).emit('remote-tool-change', {
          userId: socket.userId,
          userName: socket.userName,
          tool
        });
      }
    });

    // Create snapshot
    socket.on('create-snapshot', async ({ imageData }) => {
      if (socket.whiteboardRoom) {
        try {
          await WhiteboardService.createSnapshot(
            socket.whiteboardRoom,
            socket.userId,
            imageData
          );
          
          socket.emit('snapshot-created', { success: true });
        } catch (error) {
          console.error('Create snapshot error:', error);
          socket.emit('snapshot-created', { success: false, error: error.message });
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Whiteboard: User disconnected - ${socket.id}`);
      
      if (socket.whiteboardRoom && activeBoards.has(socket.whiteboardRoom)) {
        const room = activeBoards.get(socket.whiteboardRoom);
        room.delete(socket.id);
        
        if (room.size === 0) {
          activeBoards.delete(socket.whiteboardRoom);
        }
        
        socket.to(socket.whiteboardRoom).emit('user-left-whiteboard', {
          userId: socket.userId,
          userName: socket.userName,
          socketId: socket.id
        });
      }
    });
  });
}

module.exports = setupWhiteboardSignaling;