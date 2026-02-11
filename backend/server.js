require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { setupSurpriseHandlers } = require('./socketHandlers/surprise');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const swipeRoutes = require('./routes/swipe');
const messageRequestRoutes = require('./routes/messageRequests');
const matchRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');
const publicProfileRoutes = require('./routes/publicProfile');
const streamRoutes = require('./routes/stream');
const surpriseRoutes = require('./routes/surprise');
const moderationRoutes = require('./routes/moderation');
const liveRoutes = require('./routes/live');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/message-requests', messageRequestRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/public-profile', publicProfileRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/surprise', surpriseRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/moderation', moderationRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API Dating App fonctionne correctement',
    timestamp: new Date().toISOString()
  });
});

// Gestion WebSocket pour le chat en temps réel
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('👤 Nouvel utilisateur connecté:', socket.id);

  // Enregistrer l'utilisateur
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    console.log(`📝 Utilisateur ${userId} enregistré`);
  });

  // Message de chat
  socket.on('sendMessage', (data) => {
    const { recipientId, message, senderId } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('newMessage', {
        from: senderId,
        message: message,
        timestamp: new Date()
      });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { recipientId, isTyping } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userTyping', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Socket Live Surprise
  setupSurpriseHandlers(io, socket);

  // WebRTC Signaling pour le streaming
  socket.on('offer', (data) => {
    const { recipientId, offer } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('offer', {
        from: socket.userId,
        offer
      });
    }
  });

  socket.on('answer', (data) => {
    const { recipientId, answer } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('answer', {
        from: socket.userId,
        answer
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const { recipientId, candidate } = data;
    const recipientSocketId = userSockets.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('ice-candidate', {
        from: socket.userId,
        candidate
      });
    }
  });

  // Notification de match
  socket.on('newMatch', (data) => {
    const { userId } = data;
    const userSocketId = userSockets.get(userId);
    
    if (userSocketId) {
      io.to(userSocketId).emit('matchNotification', data);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`👋 Utilisateur ${socket.userId} déconnecté`);
    }
  });
});

// Rendre io accessible dans les routes
app.set('io', io);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📡 WebSocket activé`);
});

module.exports = { app, io };
