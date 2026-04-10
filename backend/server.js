require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');
const Message = require('./models/Message');
const setupWebRTCSignaling = require('./sockets/webrtcSignaling');
const setupWhiteboardSignaling = require('./sockets/whiteboardSignaling');

const DEFAULT_CLIENT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const normalizeOrigin = (origin = '') => origin.trim().replace(/\/$/, '');

const buildAllowedOrigins = () => {
  const fromCsv = (process.env.CLIENT_URLS || '')
    .split(',')
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);

  return new Set(
    [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      ...DEFAULT_CLIENT_ORIGINS,
      ...fromCsv
    ]
      .map((value) => normalizeOrigin(value || ''))
      .filter(Boolean)
  );
};

const ALLOWED_ORIGINS = buildAllowedOrigins();
const ALLOW_VERCEL_ORIGINS = process.env.ALLOW_VERCEL_ORIGINS !== 'false';

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);

  if (ALLOWED_ORIGINS.has(normalizedOrigin)) {
    return true;
  }

  if (ALLOW_VERCEL_ORIGINS && normalizedOrigin.endsWith('.vercel.app')) {
    return true;
  }

  return false;
};

const corsOriginHandler = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  console.warn(`Blocked by CORS: ${origin}`);
  callback(new Error('Not allowed by CORS'));
};

const corsConfig = {
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};



// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with proper CORS
const io = socketIo(server, {
  cors: corsConfig
});

setupWebRTCSignaling(io);
setupWhiteboardSignaling(io);

// Connect to database
connectDB();

// CORS Middleware - MUST be before routes
app.use(cors(corsConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// (mounted below, after request logger)
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/verifications', require('./routes/verifications'));
app.use('/api/video-calls', require('./routes/videoCalls'));
app.use('/api/learning-paths', require('./routes/learningPaths'));


// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SkillBarter API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to SkillBarter API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      skills: '/api/skills',
      bookings: '/api/bookings',
      reviews: '/api/reviews'
    }
  });
});

// ============================================
// ENHANCED SOCKET.IO CONNECTION HANDLING
// ============================================
const userSockets = new Map(); // Map userId to socketId
const onlineUsers = new Set(); // Track online user IDs

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);
    socket.userId = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);
    console.log(`📊 Online users: ${onlineUsers.size}`);
    
    // Send list of online users to the joining user
    socket.emit('online-users', Array.from(onlineUsers));
    
    // Notify all other users that this user is online
    socket.broadcast.emit('user-online', userId);
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { senderId, recipientId, content, messageType = 'text' } = data;
      
      console.log(`📤 Message from ${senderId} to ${recipientId}: "${content}"`);
      
      // Create conversation ID
      const conversationId = Message.getConversationId(senderId, recipientId);
      
      // Save message to database
      const message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        recipient: recipientId,
        content,
        messageType,
        isRead: false
      });

      // Populate sender and recipient info
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'firstName lastName avatar')
        .populate('recipient', 'firstName lastName avatar');

      console.log('✅ Message saved to database:', message._id);

      // Send to recipient if online
      const recipientSocketId = userSockets.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive-message', populatedMessage);
        console.log(`✅ Message delivered to recipient (socket: ${recipientSocketId})`);
      } else {
        console.log(`⚠️ Recipient ${recipientId} is offline - message saved for later`);
      }

      // Confirm to sender
      socket.emit('message-sent', populatedMessage);
      console.log('✅ Confirmation sent to sender');
      
    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('message-error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark-read', async (data) => {
    try {
      const { conversationId, userId } = data;
      
      await Message.updateMany(
        { 
          conversation: conversationId,
          recipient: userId,
          isRead: false
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      console.log(`✅ Messages marked as read in conversation ${conversationId}`);
      socket.emit('messages-marked-read', { conversationId });
    } catch (error) {
      console.error('❌ Mark read error:', error);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Get conversation messages
  socket.on('get-messages', async (data) => {
    try {
      const { userId1, userId2, limit = 50 } = data;
      const conversationId = Message.getConversationId(userId1, userId2);
      
      console.log(`📥 Loading messages for conversation: ${conversationId}`);
      
      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'firstName lastName avatar')
        .populate('recipient', 'firstName lastName avatar')
        .sort({ createdAt: 1 })
        .limit(limit);

      console.log(`✅ Loaded ${messages.length} messages`);
      socket.emit('messages-loaded', messages);
    } catch (error) {
      console.error('❌ Get messages error:', error);
      socket.emit('messages-error', { message: 'Failed to load messages' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.userId) {
      userSockets.delete(socket.userId);
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} went offline`);
      console.log(`📊 Online users: ${onlineUsers.size}`);
      
      // Notify all users that this user is offline
      socket.broadcast.emit('user-offline', socket.userId);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const DEFAULT_PORT = 5001;
const PORT = Number.parseInt(process.env.PORT, 10) || DEFAULT_PORT;

function printServerBanner(port) {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     SkillBarter API Server             ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  🚀 Server running on port ${port}      ║`);
  console.log(`║  🌍 Environment: ${process.env.NODE_ENV || 'development'}         ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('Allowed CORS origins:', Array.from(ALLOWED_ORIGINS));
  console.log('Allow *.vercel.app origins:', ALLOW_VERCEL_ORIGINS);
}

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.error('The dev script now auto-clears stale Node listeners before startup.');
    console.error('If another app is intentionally using this port, change PORT in backend/.env.');
    process.exit(1);
  }

  if (error?.code === 'EACCES') {
    console.error(`Permission denied while binding to port ${PORT}.`);
    process.exit(1);
  }

  console.error('Server listen error:', error);
  process.exit(1);
});

server.listen(PORT, () => {
  printServerBanner(PORT);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
