/**
 * Room Event Handlers
 *
 * Handles room management WebSocket events
 * @author {{author}}
 */

const logger = require('../utils/logger');

// In-memory room storage (replace with database in production)
const rooms = new Map();
const userRooms = new Map(); // Track which rooms each user is in

/**
 * Create a new room
 */
const createRoom = async (socket, data, callback) => {
  const { name, description, maxParticipants = 50, isPrivate = false } = data || {};
  
  if (!name || name.trim().length === 0) {
    if (callback) callback({ error: 'Room name is required' });
    return;
  }

  if (name.length > 100) {
    if (callback) callback({ error: 'Room name too long (max 100 characters)' });
    return;
  }

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const roomData = {
    id: roomId,
    name: name.trim(),
    description: description?.trim() || '',
    owner: socket.userId,
    participants: new Set([socket.userId]),
    maxParticipants: Math.min(Math.max(1, maxParticipants), 1000),
    isPrivate: Boolean(isPrivate),
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  rooms.set(roomId, roomData);
  
  // Track user's rooms
  if (!userRooms.has(socket.userId)) {
    userRooms.set(socket.userId, new Set());
  }
  userRooms.get(socket.userId).add(roomId);

  // Join the socket room
  socket.join(`room:${roomId}`);

  logger.info({
    component: 'room',
    event: 'create',
    socketId: socket.id,
    userId: socket.userId,
    roomId,
    roomName: name
  }, 'Room created');

  if (callback) {
    callback({
      success: true,
      room: {
        id: roomId,
        name: roomData.name,
        description: roomData.description,
        participants: roomData.participants.size,
        maxParticipants: roomData.maxParticipants,
        isPrivate: roomData.isPrivate,
        createdAt: roomData.createdAt
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Join an existing room
 */
const joinRoom = async (socket, data, callback) => {
  const { roomId } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    if (callback) callback({ error: 'Room not found' });
    return;
  }

  // Check if room is full
  if (room.participants.size >= room.maxParticipants) {
    if (callback) callback({ error: 'Room is full' });
    return;
  }

  // Check if user is already in the room
  if (room.participants.has(socket.userId)) {
    if (callback) callback({ error: 'Already in this room' });
    return;
  }

  // Add user to room
  room.participants.add(socket.userId);
  room.lastActivity = new Date().toISOString();

  // Track user's rooms
  if (!userRooms.has(socket.userId)) {
    userRooms.set(socket.userId, new Set());
  }
  userRooms.get(socket.userId).add(roomId);

  // Join the socket room
  socket.join(`room:${roomId}`);

  // Notify other participants
  socket.to(`room:${roomId}`).emit('room:user_joined', {
    userId: socket.userId,
    roomId,
    roomName: room.name,
    participants: room.participants.size,
    timestamp: new Date().toISOString()
  });

  logger.info({
    component: 'room',
    event: 'join',
    socketId: socket.id,
    userId: socket.userId,
    roomId,
    roomName: room.name
  }, 'User joined room');

  if (callback) {
    callback({
      success: true,
      room: {
        id: roomId,
        name: room.name,
        description: room.description,
        participants: room.participants.size,
        maxParticipants: room.maxParticipants,
        isPrivate: room.isPrivate
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Leave a room
 */
const leaveRoom = async (socket, data, callback) => {
  const { roomId } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    if (callback) callback({ error: 'Room not found' });
    return;
  }

  // Remove user from room
  room.participants.delete(socket.userId);
  room.lastActivity = new Date().toISOString();

  // Remove room from user's rooms
  if (userRooms.has(socket.userId)) {
    userRooms.get(socket.userId).delete(roomId);
  }

  // Leave the socket room
  socket.leave(`room:${roomId}`);

  // If room is empty or owner left, delete the room
  if (room.participants.size === 0 || room.owner === socket.userId) {
    rooms.delete(roomId);
    
    // Notify remaining participants if any
    socket.to(`room:${roomId}`).emit('room:deleted', {
      roomId,
      roomName: room.name,
      reason: room.owner === socket.userId ? 'owner_left' : 'empty',
      timestamp: new Date().toISOString()
    });
  } else {
    // Notify other participants
    socket.to(`room:${roomId}`).emit('room:user_left', {
      userId: socket.userId,
      roomId,
      roomName: room.name,
      participants: room.participants.size,
      timestamp: new Date().toISOString()
    });
  }

  logger.info({
    component: 'room',
    event: 'leave',
    socketId: socket.id,
    userId: socket.userId,
    roomId,
    roomName: room.name
  }, 'User left room');

  if (callback) {
    callback({
      success: true,
      roomId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * List available rooms
 */
const listRooms = async (socket, data, callback) => {
  const { includePrivate = false, limit = 50, offset = 0 } = data || {};
  
  const roomList = Array.from(rooms.values())
    .filter(room => includePrivate || !room.isPrivate)
    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    .slice(offset, offset + limit)
    .map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      participants: room.participants.size,
      maxParticipants: room.maxParticipants,
      isPrivate: room.isPrivate,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    }));

  logger.debug({
    component: 'room',
    event: 'list',
    socketId: socket.id,
    userId: socket.userId,
    roomsCount: roomList.length
  }, 'Room list requested');

  if (callback) {
    callback({
      success: true,
      rooms: roomList,
      total: Array.from(rooms.values()).filter(room => includePrivate || !room.isPrivate).length,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get detailed room information
 */
const getRoomInfo = async (socket, data, callback) => {
  const { roomId } = data || {};
  
  if (!roomId) {
    if (callback) callback({ error: 'Room ID is required' });
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    if (callback) callback({ error: 'Room not found' });
    return;
  }

  // Check if user has access to private room info
  if (room.isPrivate && !room.participants.has(socket.userId)) {
    if (callback) callback({ error: 'Access denied to private room' });
    return;
  }

  const roomInfo = {
    id: room.id,
    name: room.name,
    description: room.description,
    owner: room.owner,
    participants: room.participants.size,
    maxParticipants: room.maxParticipants,
    isPrivate: room.isPrivate,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
    isParticipant: room.participants.has(socket.userId)
  };

  logger.debug({
    component: 'room',
    event: 'info',
    socketId: socket.id,
    userId: socket.userId,
    roomId
  }, 'Room info requested');

  if (callback) {
    callback({
      success: true,
      room: roomInfo,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Clean up user's rooms on disconnect
 */
const cleanupUserRooms = (userId) => {
  if (!userRooms.has(userId)) return;

  const userRoomSet = userRooms.get(userId);
  for (const roomId of userRoomSet) {
    const room = rooms.get(roomId);
    if (room) {
      room.participants.delete(userId);
      
      // Delete room if empty or owner left
      if (room.participants.size === 0 || room.owner === userId) {
        rooms.delete(roomId);
      }
    }
  }
  
  userRooms.delete(userId);
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  listRooms,
  getRoomInfo,
  cleanupUserRooms
};