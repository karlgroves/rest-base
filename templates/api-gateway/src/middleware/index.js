/**
 * @fileoverview Middleware setup and configuration for API Gateway
 * @module middleware
 * @requires ./rateLimiter.js
 * @requires ./auth.js
 * @requires ./proxy.js
 * @requires ./errorHandler.js
 * @requires ../utils/logger.js
 */

import { generalRateLimit, authRateLimit, publicRateLimit } from './rateLimiter.js';
import { jwtAuth, optionalJwtAuth, verifyToken } from './auth.js';
import { dynamicServiceProxy } from './proxy.js';
import { asyncHandler } from './errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Request ID middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requestId(req, res, next) {
  req.requestId = req.get('X-Request-ID') || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requestLogger(req, res, next) {
  logger.info('Incoming request:', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
  });

  // Log response when request finishes
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    
    logger.info('Request completed:', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('Content-Length'),
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function securityHeaders(req, res, next) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Gateway', '{{projectName}}');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * API version middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function apiVersion(req, res, next) {
  // Extract API version from path or header
  const pathVersion = req.path.match(/^\/api\/v(\d+)/)?.[1];
  const headerVersion = req.get('API-Version');
  
  req.apiVersion = pathVersion || headerVersion || '1';
  res.setHeader('API-Version', req.apiVersion);
  
  next();
}

/**
 * Request validation middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requestValidation(req, res, next) {
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header is required',
        code: 'MISSING_CONTENT_TYPE',
      });
    }

    if (!contentType.includes('application/json') && 
        !contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Unsupported Content-Type',
        code: 'UNSUPPORTED_CONTENT_TYPE',
        supported: [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
        ],
      });
    }
  }

  next();
}

/**
 * Service health check middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function serviceHealthCheck(req, res, next) {
  // Add service availability check logic here
  // This could integrate with service discovery or health check endpoints
  next();
}

/**
 * Setup all middleware for the application
 * @param {express.Application} app - Express application instance
 * @returns {Promise<void>}
 */
export async function setupMiddleware(app) {
  try {
    // Request tracking and logging
    app.use(requestId);
    app.use(requestLogger);
    
    // Security middleware
    app.use(securityHeaders);
    
    // API version handling
    app.use(apiVersion);
    
    // Request validation
    app.use(requestValidation);
    
    // Rate limiting based on route type
    app.use('/api/v1/auth', authRateLimit);
    app.use('/api/v1/public', publicRateLimit);
    app.use('/api/v1', generalRateLimit);
    
    // Service health checking
    app.use(serviceHealthCheck);

    logger.info('All middleware configured successfully');
  } catch (error) {
    logger.error('Failed to setup middleware:', error);
    throw error;
  }
}

// Export middleware components
export {
  generalRateLimit,
  authRateLimit,
  publicRateLimit,
  jwtAuth,
  optionalJwtAuth,
  verifyToken,
  dynamicServiceProxy,
  asyncHandler,
};