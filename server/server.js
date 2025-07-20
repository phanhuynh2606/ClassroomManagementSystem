const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.config');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const initRoutes = require('./routes/index.route');
const { Server } = require('socket.io');
const http = require('http');
const User = require('./models/user.model');
// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS',"PATCH"],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Request logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Routes
initRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true
  }
});

// Store io instance in app for access from controllers
app.set('io', io);

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('🔐 Socket auth attempt, token exists:', !!token);
  
  if (!token) {
    console.log('❌ No token provided');
    return next(new Error('No token provided'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
    
    try {
      // First try to verify the token
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      console.log('✅ Socket authenticated for user:', decoded.id, 'role:', decoded.role);
      return next();
    } catch (verifyError) {
      // If token is expired, try to refresh it
      if (verifyError.name === 'TokenExpiredError') {
        try {
          // Decode the expired token to get the user ID
          const decoded = jwt.decode(token);
          
          if (!decoded || !decoded.id) {
            throw new Error('Invalid token format');
          }

          // Find the user
          const user = await User.findById(decoded.id);
          if (!user) {
            throw new Error('User not found');
          }
          
          // Generate a new token
          const newToken = jwt.sign(
            { id: user._id, role: user.role },
            jwtSecret,
            { expiresIn: '24h' }
          );
          
          // Emit the new token to the client
          socket.emit('token:refresh', { token: newToken });
          
          // Continue with the connection using the new token
          socket.userId = user._id;
          socket.userRole = user.role;
          console.log('🔄 Token refreshed for user:', user._id);
          return next();
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError.message);
          return next(new Error('Token refresh failed'));
        }
      } else {
        console.log('❌ Invalid token:', verifyError.message);
        return next(new Error('Invalid token'));
      }
    }
  } catch (err) {
    console.log('❌ Socket authentication failed:', err.message);
    return next(new Error('Authentication failed'));
  }
});

io.on('connection', async (socket) => {
  console.log(`Socket connected: ${socket.id}, User: ${socket.userId}`);

  // Automatically join user to their personal notification room
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.userId} joined personal notification room`);
    
    // Automatically join user to all their chat rooms
    try {
      const Chat = require('./models/chat.model');
      const userChats = await Chat.find({
        'members.user': socket.userId,
        'members.isActive': true,
        deleted: false
      }).select('_id');
      
      console.log(`🏠 Found ${userChats.length} active chats for user ${socket.userId}`);
      
      userChats.forEach(chat => {
        socket.join(`chat_${chat._id}`);
        console.log(`✅ User ${socket.userId} auto-joined chat ${chat._id}`);
      });
      
      console.log(`🎉 User ${socket.userId} successfully joined ${userChats.length} chat rooms`);
    } catch (error) {
      console.error('❌ Error auto-joining user chats:', error);
    }
  }

  // Client yêu cầu join một room (classroom, etc.)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });

  // Leave a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.userId} left room ${roomId}`);
  });

  // Gửi thông báo đến một room cụ thể
  socket.on('send-to-room', ({ roomId, message }) => {
    io.to(roomId).emit('receive-message', message);
    console.log(`Sent to room ${roomId}: ${message}`);
  });

  // Handle notification events
  socket.on('mark-notification-read', (notificationId) => {
    console.log(`User ${socket.userId} marked notification ${notificationId} as read`);
    // You can add additional real-time updates here if needed
  });

  // Handle typing indicators for chat (future feature)
  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Chat-specific events
  socket.on('join-chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  socket.on('typing-in-chat', async ({ chatId, isTyping }) => {
    try {
      const user = await User.findById(socket.userId).select('fullName');
      socket.to(`chat_${chatId}`).emit('user-typing-in-chat', {
        userId: socket.userId,
        userName: user ? user.fullName : 'Unknown User',
        userRole: socket.userRole,
        isTyping
      });
    } catch (error) {
      console.error('Error fetching user for typing indicator:', error);
      socket.to(`chat_${chatId}`).emit('user-typing-in-chat', {
        userId: socket.userId,
        userName: 'Unknown User',
        userRole: socket.userRole,
        isTyping
      });
    }
  });

  socket.on('message-read', ({ chatId, messageId }) => {
    socket.to(`chat_${chatId}`).emit('message-read-update', {
      messageId,
      userId: socket.userId
    });
  });

  // Test message for debugging
  socket.on('test-message', (data) => {
    console.log('🔧 Debug: Received test message from', socket.userId, ':', data);
    // Echo back to all connected clients
    io.emit('test-message', {
      ...data,
      from: socket.userId,
      socketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}, User: ${socket.userId}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 