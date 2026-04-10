// WebRTC Signaling Handler for Socket.IO
// Add this to your existing socket.io setup in server.js

const VideoCallService = require('../services/videoCallService');

function setupWebRTCSignaling(io) {
  
  // Store active rooms and their participants
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log(`WebRTC: User connected - ${socket.id}`);

    // Join video call room
    socket.on('join-room', async ({ roomId, userId, userName }) => {
      try {
        console.log(`${userName} joining room ${roomId}`);
        
        // Join Socket.IO room
        socket.join(roomId);
        
        // Store user info
        socket.userId = userId;
        socket.userName = userName;
        socket.roomId = roomId;
        
        // Track room participants
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);
        
        // Notify other participants
        socket.to(roomId).emit('user-joined', {
          userId,
          userName,
          socketId: socket.id
        });
        
        // Send list of existing participants to new user
        const participants = Array.from(rooms.get(roomId))
          .filter(id => id !== socket.id)
          .map(id => {
            const participantSocket = io.sockets.sockets.get(id);
            return {
              socketId: id,
              userId: participantSocket?.userId,
              userName: participantSocket?.userName
            };
          });
        
        socket.emit('existing-participants', participants);
        
        console.log(`Room ${roomId} now has ${rooms.get(roomId).size} participants`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC Offer
    socket.on('offer', ({ offer, to }) => {
      console.log(`Sending offer from ${socket.id} to ${to}`);
      io.to(to).emit('offer', {
        offer,
        from: socket.id,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // WebRTC Answer
    socket.on('answer', ({ answer, to }) => {
      console.log(`Sending answer from ${socket.id} to ${to}`);
      io.to(to).emit('answer', {
        answer,
        from: socket.id
      });
    });

    // ICE Candidate
    socket.on('ice-candidate', ({ candidate, to }) => {
      io.to(to).emit('ice-candidate', {
        candidate,
        from: socket.id
      });
    });

    // Toggle video
    socket.on('toggle-video', ({ enabled }) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-video-toggled', {
          userId: socket.userId,
          socketId: socket.id,
          enabled
        });
      }
    });

    // Toggle audio
    socket.on('toggle-audio', ({ enabled }) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-audio-toggled', {
          userId: socket.userId,
          socketId: socket.id,
          enabled
        });
      }
    });

    // Screen share start
    socket.on('start-screen-share', async () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-started-screen-share', {
          userId: socket.userId,
          socketId: socket.id,
          userName: socket.userName
        });
        
        // Update call features
        try {
          await VideoCallService.toggleFeature(socket.roomId, 'screenShare', true);
        } catch (error) {
          console.error('Error toggling screen share:', error);
        }
      }
    });

    // Screen share stop
    socket.on('stop-screen-share', async () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-stopped-screen-share', {
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });

    // Chat message
    socket.on('chat-message', async ({ message }) => {
      if (socket.roomId) {
        const chatData = {
          userId: socket.userId,
          userName: socket.userName,
          message,
          timestamp: new Date()
        };
        
        // Broadcast to room
        io.to(socket.roomId).emit('chat-message', chatData);
        
        // Save to database
        try {
          await VideoCallService.addChatMessage(socket.roomId, socket.userId, message);
        } catch (error) {
          console.error('Error saving chat message:', error);
        }
      }
    });

    // Whiteboard data
    socket.on('whiteboard-data', ({ data }) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('whiteboard-data', {
          data,
          userId: socket.userId
        });
      }
    });

    // Connection quality update
    socket.on('connection-quality', ({ quality }) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-connection-quality', {
          userId: socket.userId,
          socketId: socket.id,
          quality
        });
      }
    });

    // Report issue
    socket.on('report-issue', async ({ issueType }) => {
      if (socket.roomId) {
        try {
          await VideoCallService.reportIssue(socket.roomId, socket.userId, issueType);
          socket.emit('issue-reported', { success: true });
        } catch (error) {
          console.error('Error reporting issue:', error);
          socket.emit('issue-reported', { success: false, error: error.message });
        }
      }
    });

    // Leave room
    socket.on('leave-room', async () => {
      await handleUserLeaving(socket);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`WebRTC: User disconnected - ${socket.id}`);
      await handleUserLeaving(socket);
    });

    // Handle user leaving
    async function handleUserLeaving(socket) {
      if (socket.roomId) {
        const roomId = socket.roomId;
        
        // Remove from room tracking
        if (rooms.has(roomId)) {
          rooms.get(roomId).delete(socket.id);
          
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
          }
        }
        
        // Notify other participants
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          socketId: socket.id,
          userName: socket.userName
        });
        
        // Update database
        try {
          if (socket.userId) {
            await VideoCallService.leaveCall(roomId, socket.userId);
          }
        } catch (error) {
          console.error('Error updating leave call:', error);
        }
        
        socket.leave(roomId);
        console.log(`User ${socket.userName} left room ${roomId}`);
      }
    }
  });
}

module.exports = setupWebRTCSignaling;