/**
 * Chat Event Handlers
 *
 * Handles chat-related WebSocket events
 * @author {{author}}
 */

const logger = require('../utils/logger');

// In-memory chat storage (replace with database in production)
const chatRooms = new Map();
const chatHistory = new Map();

/**
 * Join a chat room
 */
const joinChat = async (socket, data, callback) => {
  const { roomId } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  // Initialize room if it doesn't exist
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, new Set());
    chatHistory.set(roomId, []);
  }

  // Join socket room
  socket.join(`chat:${roomId}`);
  chatRooms.get(roomId).add(socket.id);

  // Notify other users in the room
  socket.to(`chat:${roomId}`).emit('chat:user_joined', {
    userId: socket.userId,
    roomId,
    timestamp: new Date().toISOString()
  });

  logger.info({
    component: 'chat',
    event: 'join',
    socketId: socket.id,
    userId: socket.userId,
    roomId
  }, 'User joined chat room');

  if (callback) {
    callback({
      success: true,
      roomId,
      participants: chatRooms.get(roomId).size,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Leave a chat room
 */
const leaveChat = async (socket, data, callback) => {
  const { roomId } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  // Leave socket room
  socket.leave(`chat:${roomId}`);
  
  if (chatRooms.has(roomId)) {
    chatRooms.get(roomId).delete(socket.id);
    
    // Clean up empty rooms
    if (chatRooms.get(roomId).size === 0) {
      chatRooms.delete(roomId);
    }
  }

  // Notify other users in the room
  socket.to(`chat:${roomId}`).emit('chat:user_left', {
    userId: socket.userId,
    roomId,
    timestamp: new Date().toISOString()
  });

  logger.info({
    component: 'chat',
    event: 'leave',
    socketId: socket.id,
    userId: socket.userId,
    roomId
  }, 'User left chat room');

  if (callback) {
    callback({
      success: true,
      roomId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Send a chat message
 */
const sendMessage = async (socket, data, callback) => {
  const { roomId, message, type = 'text' } = data || {};
  
  if (!roomId || !message) {
    if (callback) callback({ error: 'Room ID and message are required' });
    return;
  }

  if (message.length > 1000) {
    if (callback) callback({ error: 'Message too long (max 1000 characters)' });
    return;
  }

  // Validate message type
  if (!['text', 'image', 'file', 'code'].includes(type)) {
    if (callback) callback({ error: 'Invalid message type' });
    return;
  }

  const messageData = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: socket.userId,
    roomId,
    message: message.trim(),
    type,
    timestamp: new Date().toISOString()
  };

  // Store message in history
  if (!chatHistory.has(roomId)) {
    chatHistory.set(roomId, []);
  }
  
  const history = chatHistory.get(roomId);
  history.push(messageData);
  
  // Keep only last 100 messages per room
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }

  // Broadcast message to room
  socket.to(`chat:${roomId}`).emit('chat:message', messageData);

  logger.info({
    component: 'chat',
    event: 'message',
    socketId: socket.id,
    userId: socket.userId,
    roomId,
    messageType: type,
    messageLength: message.length
  }, 'Chat message sent');

  if (callback) {
    callback({
      success: true,
      message: messageData,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle typing indicators
 */
const handleTyping = async (socket, data, callback) => {
  const { roomId, isTyping } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  // Broadcast typing status to room
  socket.to(`chat:${roomId}`).emit('chat:typing', {
    userId: socket.userId,
    roomId,
    isTyping: Boolean(isTyping),
    timestamp: new Date().toISOString()
  });

  if (callback) {
    callback({
      success: true,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get chat history for a room
 */
const getChatHistory = async (socket, data, callback) => {
  const { roomId, limit = 50, offset = 0 } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  const history = chatHistory.get(roomId) || [];
  const startIndex = Math.max(0, history.length - limit - offset);
  const endIndex = Math.max(0, history.length - offset);
  const messages = history.slice(startIndex, endIndex);

  logger.debug({
    component: 'chat',
    event: 'history',
    socketId: socket.id,
    userId: socket.userId,
    roomId,
    messagesCount: messages.length
  }, 'Chat history requested');

  if (callback) {
    callback({
      success: true,
      roomId,
      messages,
      total: history.length,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  joinChat,
  leaveChat,
  sendMessage,
  handleTyping,
  getChatHistory
};