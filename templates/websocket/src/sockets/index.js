/**
 * Socket.IO Event Handlers
 *
 * Main socket event handling and routing
 * @author {{author}}
 */

const logger = require('../utils/logger');
const chatHandlers = require('./chatHandlers');
const roomHandlers = require('./roomHandlers');
const notificationHandlers = require('./notificationHandlers');

// Rate limiting for socket events
const eventRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 events per minute

/**
 * Rate limiting middleware for socket events
 */
const rateLimitSocket = (socket, eventName) => {
  const key = `${socket.id}:${eventName}`;
  const now = Date.now();
  
  if (!eventRateLimit.has(key)) {
    eventRateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  const limit = eventRateLimit.get(key);
  
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    logger.warn({
      component: 'websocket',
      event: 'rate_limit_exceeded',
      socketId: socket.id,
      userId: socket.userId,
      eventName
    }, 'Socket event rate limit exceeded');
    return false;
  }
  
  limit.count++;
  return true;
};

/**
 * Middleware to wrap socket handlers with error handling and rate limiting
 */
const wrapHandler = (handler, eventName) => {
  return async (socket, data, callback) => {
    // Rate limiting
    if (!rateLimitSocket(socket, eventName)) {
      if (callback) callback({ error: 'Rate limit exceeded' });
      return;
    }

    try {
      logger.debug({
        component: 'websocket',
        event: eventName,
        socketId: socket.id,
        userId: socket.userId,
        data: typeof data === 'object' ? Object.keys(data) : typeof data
      }, 'Socket event received');

      await handler(socket, data, callback);
    } catch (error) {
      logger.error({
        component: 'websocket',
        event: 'handler_error',
        socketId: socket.id,
        userId: socket.userId,
        eventName,
        err: error
      }, 'Socket handler error');

      if (callback) {
        callback({ error: 'Internal server error' });
      } else {
        socket.emit('error', { message: 'An error occurred processing your request' });
      }
    }
  };
};

/**
 * Setup all socket event handlers
 */
const setupSocketHandlers = (io, socket) => {
  // Chat handlers
  socket.on('chat:join', wrapHandler(chatHandlers.joinChat, 'chat:join'));
  socket.on('chat:leave', wrapHandler(chatHandlers.leaveChat, 'chat:leave'));
  socket.on('chat:message', wrapHandler(chatHandlers.sendMessage, 'chat:message'));
  socket.on('chat:typing', wrapHandler(chatHandlers.handleTyping, 'chat:typing'));
  socket.on('chat:history', wrapHandler(chatHandlers.getChatHistory, 'chat:history'));

  // Room handlers
  socket.on('room:create', wrapHandler(roomHandlers.createRoom, 'room:create'));
  socket.on('room:join', wrapHandler(roomHandlers.joinRoom, 'room:join'));
  socket.on('room:leave', wrapHandler(roomHandlers.leaveRoom, 'room:leave'));
  socket.on('room:list', wrapHandler(roomHandlers.listRooms, 'room:list'));
  socket.on('room:info', wrapHandler(roomHandlers.getRoomInfo, 'room:info'));

  // Notification handlers
  socket.on('notification:subscribe', wrapHandler(notificationHandlers.subscribe, 'notification:subscribe'));
  socket.on('notification:unsubscribe', wrapHandler(notificationHandlers.unsubscribe, 'notification:unsubscribe'));
  socket.on('notification:mark_read', wrapHandler(notificationHandlers.markAsRead, 'notification:mark_read'));

  // General event handlers
  socket.on('ping', wrapHandler(async (socket, data, callback) => {
    if (callback) {
      callback({ pong: true, timestamp: new Date().toISOString() });
    }
  }, 'ping'));

  socket.on('user:status', wrapHandler(async (socket, data, callback) => {
    const { status } = data || {};
    
    if (!['online', 'away', 'busy', 'offline'].includes(status)) {
      if (callback) callback({ error: 'Invalid status' });
      return;
    }

    socket.status = status;
    socket.broadcast.emit('user:status_change', {
      userId: socket.userId,
      status,
      timestamp: new Date().toISOString()
    });

    if (callback) callback({ success: true });
  }, 'user:status'));

  // Heartbeat/keepalive
  socket.on('heartbeat', wrapHandler(async (socket, data, callback) => {
    socket.lastHeartbeat = Date.now();
    if (callback) callback({ timestamp: new Date().toISOString() });
  }, 'heartbeat'));

  // Store socket reference for the user
  socket.join(`user:${socket.userId}`);
  
  // Broadcast user online status
  socket.broadcast.emit('user:online', {
    userId: socket.userId,
    timestamp: new Date().toISOString()
  });
};

// Cleanup rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of eventRateLimit.entries()) {
    if (now > limit.resetTime) {
      eventRateLimit.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

module.exports = {
  setupSocketHandlers,
  rateLimitSocket
};