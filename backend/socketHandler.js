const Message = require('./models/Message');
const User = require('./models/User');

// Store connected users: { userId: socketId }
const connectedUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins
    socket.on('join', async (userId) => {
      try {
        console.log(`User ${userId} joined with socket ${socket.id}`);
        
        // Store user's socket ID
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;

        // Join user's personal room
        socket.join(userId);

        // Broadcast user online status to ALL other users
        socket.broadcast.emit('user-online', userId);

        // Send list of currently online users to this user
        const onlineUserIds = Array.from(connectedUsers.keys());
        socket.emit('online-users', onlineUserIds);

        console.log(`📊 Online users: ${connectedUsers.size}`);
      } catch (error) {
        console.error('Join error:', error);
      }
    });

    // Get messages between two users
    socket.on('get-messages', async ({ userId1, userId2, limit = 50 }) => {
      try {
        console.log(`📥 Loading messages between ${userId1} and ${userId2}`);
        
        const messages = await Message.find({
          $or: [
            { sender: userId1, recipient: userId2 },
            { sender: userId2, recipient: userId1 }
          ]
        })
          .sort({ createdAt: 1 })
          .limit(limit)
          .populate('sender', 'firstName lastName avatar')
          .populate('recipient', 'firstName lastName avatar');

        console.log(`✅ Loaded ${messages.length} messages`);
        socket.emit('messages-loaded', messages);
      } catch (error) {
        console.error('Get messages error:', error);
        socket.emit('error', { message: 'Failed to load messages' });
      }
    });

    // Send message
    socket.on('send-message', async ({ senderId, recipientId, content, messageType = 'text' }) => {
      try {
        console.log(`📤 Message from ${senderId} to ${recipientId}: "${content}"`);

        // Create message in database
        const message = new Message({
          sender: senderId,
          recipient: recipientId,
          content,
          messageType,
          isRead: false
        });

        await message.save();

        // Populate sender info
        await message.populate('sender', 'firstName lastName avatar');
        await message.populate('recipient', 'firstName lastName avatar');

        console.log('✅ Message saved:', message._id);

        // Send confirmation to sender
        socket.emit('message-sent', message);
        console.log('✅ Confirmation sent to sender');

        // Send message to recipient if online
        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive-message', message);
          console.log(`✅ Message delivered to recipient (${recipientSocketId})`);
        } else {
          console.log(`⚠️ Recipient ${recipientId} is offline`);
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ recipientId, isTyping }) => {
      const recipientSocketId = connectedUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-typing', {
          userId: socket.userId,
          isTyping
        });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async ({ conversationId, userId }) => {
      try {
        const [userId1, userId2] = conversationId.split('_');
        const otherUserId = userId1 === userId ? userId2 : userId1;

        await Message.updateMany(
          {
            sender: otherUserId,
            recipient: userId,
            isRead: false
          },
          { isRead: true }
        );

        console.log(`✅ Messages marked as read in conversation ${conversationId}`);
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // User disconnects
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Broadcast user offline status
        socket.broadcast.emit('user-offline', socket.userId);
        
        console.log(`User ${socket.userId} went offline`);
        console.log(`📊 Online users: ${connectedUsers.size}`);
      }
    });
  });
};

module.exports = setupSocketHandlers;