/**
 * @fileoverview JWT authentication middleware for API Gateway
 * @module middleware/auth
 * @requires express-jwt
 * @requires jsonwebtoken
 * @requires jwks-rsa
 * @requires ../config/index.js
 * @requires ../utils/logger.js
 */

import { expressjwt } from 'express-jwt';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Extract JWT token from request
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
function getTokenFromRequest(req) {
  // Check Authorization header
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter (not recommended for production)
  if (req.query.token) {
    return req.query.token;
  }

  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

/**
 * JWKS client for external JWT verification (optional)
 */
const jwksClientInstance = process.env.JWKS_URI ? jwksClient({
  jwksUri: process.env.JWKS_URI,
  requestHeaders: {},
  timeout: 30000,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
}) : null;

/**
 * Get signing key for JWT verification
 * @param {Object} header - JWT header
 * @param {Function} callback - Callback function
 */
function getKey(header, callback) {
  if (jwksClientInstance) {
    jwksClientInstance.getSigningKey(header.kid, (err, key) => {
      if (err) {
        logger.error('Error getting signing key:', err);
        return callback(err);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  } else {
    // Use symmetric key
    callback(null, config.jwt.secret);
  }
}

/**
 * JWT authentication middleware using express-jwt
 */
export const jwtAuth = expressjwt({
  secret: jwksClientInstance ? getKey : config.jwt.secret,
  algorithms: config.jwt.algorithms,
  audience: config.jwt.audience,
  issuer: config.jwt.issuer,
  getToken: getTokenFromRequest,
  credentialsRequired: true,
});

/**
 * Optional JWT authentication middleware
 * Doesn't throw error if token is missing
 */
export const optionalJwtAuth = expressjwt({
  secret: jwksClientInstance ? getKey : config.jwt.secret,
  algorithms: config.jwt.algorithms,
  audience: config.jwt.audience,
  issuer: config.jwt.issuer,
  getToken: getTokenFromRequest,
  credentialsRequired: false,
});

/**
 * Custom JWT verification middleware with enhanced error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
export function verifyToken(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      error: 'Access token is required',
      code: 'TOKEN_MISSING',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
      algorithms: config.jwt.algorithms,
    });

    // Add user information to request
    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    logger.warn(`JWT verification failed: ${error.message}`);

    let errorCode = 'TOKEN_INVALID';
    let statusCode = 401;

    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'TOKEN_MALFORMED';
    } else if (error.name === 'NotBeforeError') {
      errorCode = 'TOKEN_NOT_ACTIVE';
    }

    return res.status(statusCode).json({
      error: 'Invalid access token',
      code: errorCode,
      message: error.message,
    });
  }
}

/**
 * Role-based authorization middleware
 * @param {string|Array<string>} requiredRoles - Required roles for access
 * @returns {Function} Express middleware function
 */
export function requireRoles(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn(`Access denied for user ${req.user.id}: insufficient roles`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRoles,
      });
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 * @param {string|Array<string>} requiredPermissions - Required permissions
 * @returns {Function} Express middleware function
 */
export function requirePermissions(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasRequiredPermission = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      logger.warn(`Access denied for user ${req.user.id}: insufficient permissions`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        current: userPermissions,
      });
    }

    next();
  };
}