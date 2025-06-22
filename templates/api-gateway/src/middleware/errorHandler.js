/**
 * @fileoverview Error handling middleware for API Gateway
 * @module middleware/errorHandler
 * @requires ../utils/logger.js
 * @requires ../config/index.js
 */

import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Gateway-specific error types
 */
export const GatewayErrorTypes = {
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  PROXY_ERROR: 'PROXY_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
};

/**
 * Custom Gateway Error class
 */
export class GatewayError extends Error {
  /**
   * Create a gateway error
   * @param {string} message - Error message
   * @param {string} type - Error type from GatewayErrorTypes
   * @param {number} statusCode - HTTP status code
   * @param {Object} metadata - Additional error metadata
   */
  constructor(message, type, statusCode = 500, metadata = {}) {
    super(message);
    this.name = 'GatewayError';
    this.type = type;
    this.statusCode = statusCode;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle JWT authentication errors
 * @param {Error} error - JWT error
 * @returns {Object} Formatted error response
 */
function handleJwtError(error) {
  const errorMap = {
    UnauthorizedError: {
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
    TokenExpiredError: {
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      message: 'Access token has expired',
    },
    JsonWebTokenError: {
      statusCode: 401,
      code: 'TOKEN_INVALID',
      message: 'Invalid access token',
    },
    NotBeforeError: {
      statusCode: 401,
      code: 'TOKEN_NOT_ACTIVE',
      message: 'Token not active yet',
    },
  };

  const errorInfo = errorMap[error.name] || {
    statusCode: 401,
    code: 'AUTH_ERROR',
    message: 'Authentication failed',
  };

  return {
    ...errorInfo,
    details: config.env === 'development' ? error.message : undefined,
  };
}

/**
 * Handle validation errors
 * @param {Error} error - Validation error
 * @returns {Object} Formatted error response
 */
function handleValidationError(error) {
  const details = error.details ? error.details.map(detail => ({
    field: detail.path?.join('.'),
    message: detail.message,
    value: detail.context?.value,
  })) : [];

  return {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details,
  };
}

/**
 * Handle proxy and service errors
 * @param {Error} error - Proxy error
 * @returns {Object} Formatted error response
 */
function handleProxyError(error) {
  const errorMap = {
    ECONNREFUSED: {
      statusCode: 502,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
    },
    ENOTFOUND: {
      statusCode: 502,
      code: 'SERVICE_NOT_FOUND',
      message: 'Service endpoint not found',
    },
    ETIMEDOUT: {
      statusCode: 504,
      code: 'SERVICE_TIMEOUT',
      message: 'Service request timeout',
    },
    ECONNRESET: {
      statusCode: 502,
      code: 'CONNECTION_RESET',
      message: 'Service connection reset',
    },
  };

  const errorInfo = errorMap[error.code] || {
    statusCode: 502,
    code: 'PROXY_ERROR',
    message: 'Service proxy error',
  };

  return {
    ...errorInfo,
    service: error.service || 'unknown',
    details: config.env === 'development' ? error.message : undefined,
  };
}

/**
 * Format error response for client
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, req) {
  const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';
  const timestamp = new Date().toISOString();

  // Handle different error types
  if (error instanceof GatewayError) {
    return {
      error: error.message,
      code: error.type,
      statusCode: error.statusCode,
      metadata: error.metadata,
      requestId,
      timestamp,
    };
  }

  // Handle JWT errors
  if (error.name === 'UnauthorizedError' || error.name?.includes('JsonWebToken')) {
    const jwtError = handleJwtError(error);
    return {
      error: jwtError.message,
      code: jwtError.code,
      statusCode: jwtError.statusCode,
      details: jwtError.details,
      requestId,
      timestamp,
    };
  }

  // Handle validation errors (Joi)
  if (error.name === 'ValidationError' && error.isJoi) {
    const validationError = handleValidationError(error);
    return {
      error: validationError.message,
      code: validationError.code,
      statusCode: validationError.statusCode,
      details: validationError.details,
      requestId,
      timestamp,
    };
  }

  // Handle proxy errors
  if (error.code && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'].includes(error.code)) {
    const proxyError = handleProxyError(error);
    return {
      error: proxyError.message,
      code: proxyError.code,
      statusCode: proxyError.statusCode,
      service: proxyError.service,
      details: proxyError.details,
      requestId,
      timestamp,
    };
  }

  // Handle generic errors
  const statusCode = error.statusCode || error.status || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  return {
    error: isClientError ? error.message : 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    statusCode,
    details: config.env === 'development' ? error.stack : undefined,
    requestId,
    timestamp,
  };
}

/**
 * Global error handling middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(error, req, res, next) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const errorResponse = formatErrorResponse(error, req);
  const { statusCode, ...responseBody } = errorResponse;

  // Log error details
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]('Gateway error:', {
    error: error.message,
    stack: error.stack,
    requestId: errorResponse.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
  });

  // Send error response
  res.status(statusCode).json(responseBody);
}

/**
 * Handle 404 errors (route not found)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function notFoundHandler(req, res) {
  const error = new GatewayError(
    `Route not found: ${req.method} ${req.path}`,
    GatewayErrorTypes.VALIDATION_ERROR,
    404,
    {
      method: req.method,
      path: req.path,
      availableRoutes: [
        'GET /health',
        'GET /api/v1/*',
        'POST /api/v1/*',
        'PUT /api/v1/*',
        'DELETE /api/v1/*',
      ],
    }
  );

  const errorResponse = formatErrorResponse(error, req);
  const { statusCode, ...responseBody } = errorResponse;

  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(statusCode).json(responseBody);
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}