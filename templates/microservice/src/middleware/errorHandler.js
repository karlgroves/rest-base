/**
 * Error Handler Middleware
 *
 * Global error handling for Express applications
 * @author {{author}}
 */

const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * Should be placed after all routes and other middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    component: 'error-handler',
    err,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  }, 'Unhandled error occurred');

  // Default error response
  let status = err.status || err.statusCode || 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate field value';
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, send the actual error message
    message = err.message;
  }

  // Send error response
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 * Should be placed after all routes but before error handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};