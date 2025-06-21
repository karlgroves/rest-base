/**
 * Error Handling Middleware
 *
 * Express error handling middleware for consistent error responses
 * @author {{author}}
 */

const logger = require('../utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found handler middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ValidationError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new ValidationError(message);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = new ValidationError(message);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Duplicate field value entered';
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new UnauthorizedError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new UnauthorizedError(message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  notFoundHandler,
  errorHandler
};
