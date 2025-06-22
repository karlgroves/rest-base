/**
 * Authentication Middleware
 *
 * Socket.IO authentication and authorization
 * @author {{author}}
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Authenticate socket connections
 */
const authenticateSocket = (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      logger.warn({
        component: 'auth',
        event: 'socket_auth_failed',
        socketId: socket.id,
        reason: 'no_token'
      }, 'Socket authentication failed: No token provided');
      
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to socket
    socket.userId = decoded.userId || decoded.id || decoded.sub;
    socket.userEmail = decoded.email;
    socket.userRole = decoded.role || 'user';
    socket.tokenExpires = decoded.exp;

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      logger.warn({
        component: 'auth',
        event: 'socket_auth_failed',
        socketId: socket.id,
        userId: socket.userId,
        reason: 'token_expired'
      }, 'Socket authentication failed: Token expired');
      
      return next(new Error('Token expired'));
    }

    logger.info({
      component: 'auth',
      event: 'socket_authenticated',
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.userRole
    }, 'Socket authenticated successfully');

    next();
  } catch (error) {
    logger.warn({
      component: 'auth',
      event: 'socket_auth_failed',
      socketId: socket.id,
      err: error,
      reason: 'invalid_token'
    }, 'Socket authentication failed: Invalid token');
    
    next(new Error('Invalid token'));
  }
};

/**
 * Authorize socket actions based on user role
 */
const authorizeSocket = (requiredRole = 'user') => {
  return (socket, next) => {
    if (!socket.userRole) {
      return next(new Error('User role not found'));
    }

    // Role hierarchy: admin > moderator > user
    const roleHierarchy = {
      'user': 1,
      'moderator': 2,
      'admin': 3
    };

    const userLevel = roleHierarchy[socket.userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      logger.warn({
        component: 'auth',
        event: 'socket_authorization_failed',
        socketId: socket.id,
        userId: socket.userId,
        userRole: socket.userRole,
        requiredRole
      }, 'Socket authorization failed: Insufficient permissions');
      
      return next(new Error('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Generate JWT token for testing/development
 */
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract user ID from socket
 */
const getUserId = (socket) => {
  return socket.userId;
};

/**
 * Check if user has role
 */
const hasRole = (socket, role) => {
  const roleHierarchy = {
    'user': 1,
    'moderator': 2,
    'admin': 3
  };

  const userLevel = roleHierarchy[socket.userRole] || 0;
  const requiredLevel = roleHierarchy[role] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Middleware to check token expiration
 */
const checkTokenExpiration = (socket, next) => {
  if (socket.tokenExpires && Date.now() >= socket.tokenExpires * 1000) {
    logger.warn({
      component: 'auth',
      event: 'token_expired',
      socketId: socket.id,
      userId: socket.userId
    }, 'Token expired during session');
    
    socket.emit('auth:token_expired', {
      message: 'Your session has expired. Please login again.',
      timestamp: new Date().toISOString()
    });
    
    return next(new Error('Token expired'));
  }
  
  next();
};

module.exports = {
  authenticateSocket,
  authorizeSocket,
  generateToken,
  verifyToken,
  getUserId,
  hasRole,
  checkTokenExpiration
};