/**
 * {{projectName}} WebSocket Server
 *
 * Real-time WebSocket server with Socket.IO
 * @author {{author}}
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { setupSocketHandlers } = require('./sockets');
const healthRoutes = require('./routes/health');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS for HTTP routes
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Request logging
app.use(morgan('combined', {
  stream: { write: message => logger.info({ component: 'http' }, message.trim()) }
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check routes
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: '{{projectName}}',
    version: '1.0.0',
    description: '{{description}}',
    websocket: {
      endpoint: `ws://localhost:${PORT}`,
      transports: ['websocket', 'polling']
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Socket connection stats
let connectionStats = {
  current: 0,
  total: 0,
  peak: 0
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectionStats.current++;
  connectionStats.total++;
  connectionStats.peak = Math.max(connectionStats.peak, connectionStats.current);

  logger.info({
    component: 'websocket',
    event: 'connection',
    socketId: socket.id,
    userId: socket.userId,
    stats: connectionStats
  }, 'Client connected');

  // Setup socket handlers
  setupSocketHandlers(io, socket);

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    connectionStats.current--;
    
    logger.info({
      component: 'websocket',
      event: 'disconnect',
      socketId: socket.id,
      userId: socket.userId,
      reason,
      stats: connectionStats
    }, 'Client disconnected');
  });

  // Handle connection errors
  socket.on('error', (error) => {
    logger.error({
      component: 'websocket',
      event: 'error',
      socketId: socket.id,
      userId: socket.userId,
      err: error
    }, 'Socket error occurred');
  });
});

// WebSocket stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    connections: connectionStats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error({
    component: 'http',
    err,
    url: req.originalUrl,
    method: req.method
  }, 'HTTP error occurred');

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info({ component: 'server' }, 'Shutting down gracefully...');
  
  server.close(() => {
    logger.info({ component: 'server' }, 'HTTP server closed');
    
    io.close(() => {
      logger.info({ component: 'websocket' }, 'WebSocket server closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error({ component: 'server' }, 'Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
server.listen(PORT, () => {
  logger.info({
    component: 'server',
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  }, '{{projectName}} WebSocket server started');
});

// Export for testing
module.exports = { app, server, io };