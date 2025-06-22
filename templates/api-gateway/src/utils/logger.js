/**
 * @fileoverview Bunyan logger configuration for API Gateway
 * @module utils/logger
 * @requires bunyan
 * @requires ../config/index.js
 */

import bunyan from 'bunyan';
import config from '../config/index.js';

/**
 * Create Bunyan logger instance
 */
const logger = bunyan.createLogger({
  name: '{{projectName}}',
  version: '1.0.0',
  level: config.logging.level,
  serializers: bunyan.stdSerializers,
  streams: [],
  // Add default fields to all log entries
  service: '{{projectName}}',
  environment: config.env,
});

/**
 * Configure streams based on environment
 */
if (config.env === 'development') {
  // Pretty-print logs for development
  logger.addStream({
    level: config.logging.level,
    stream: process.stdout,
    type: 'stream',
  });
} else {
  // JSON logs for production
  logger.addStream({
    level: config.logging.level,
    stream: process.stdout,
    type: 'stream',
  });
}

/**
 * Add file streams for production
 */
if (config.env === 'production') {
  // Error log file
  logger.addStream({
    level: 'error',
    path: 'logs/error.log',
    type: 'rotating-file',
    period: '1d',
    count: 5,
  });

  // Combined log file
  logger.addStream({
    level: 'info',
    path: 'logs/combined.log',
    type: 'rotating-file',
    period: '1d',
    count: 10,
  });
}

/**
 * Create child logger with additional context
 * @param {Object} context - Additional context to include in logs
 * @returns {Object} Child logger instance
 */
export function createChildLogger(context = {}) {
  return logger.child(context);
}

/**
 * Log request information
 * @param {Object} req - Express request object
 * @param {string} message - Log message
 * @param {Object} extra - Additional log data
 */
export function logRequest(req, message = 'Request', extra = {}) {
  logger.info({
    msg: message,
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    ...extra,
  });
}

/**
 * Log response information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Log message
 * @param {Object} extra - Additional log data
 */
export function logResponse(req, res, message = 'Response', extra = {}) {
  const responseTime = Date.now() - req.startTime;
  
  logger.info({
    msg: message,
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime,
    contentLength: res.get('Content-Length'),
    userId: req.user?.id,
    ...extra,
  });
}

/**
 * Log error with request context
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {string} message - Log message
 * @param {Object} extra - Additional log data
 */
export function logError(error, req, message = 'Request error', extra = {}) {
  logger.error({
    msg: message,
    err: error,
    requestId: req?.requestId,
    method: req?.method,
    url: req?.url,
    ip: req?.ip,
    userId: req?.user?.id,
    ...extra,
  });
}

/**
 * Log service proxy information
 * @param {string} serviceName - Service name
 * @param {Object} req - Express request object
 * @param {string} targetUrl - Target service URL
 * @param {Object} extra - Additional log data
 */
export function logProxy(serviceName, req, targetUrl, extra = {}) {
  logger.info({
    msg: 'Proxying request',
    service: serviceName,
    targetUrl,
    requestId: req.requestId,
    method: req.method,
    originalUrl: req.originalUrl,
    userId: req.user?.id,
    ...extra,
  });
}

/**
 * Log authentication events
 * @param {string} event - Auth event type
 * @param {Object} req - Express request object
 * @param {Object} extra - Additional log data
 */
export function logAuth(event, req, extra = {}) {
  logger.info({
    msg: `Auth: ${event}`,
    event,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    ...extra,
  });
}

/**
 * Log rate limiting events
 * @param {Object} req - Express request object
 * @param {string} limitType - Type of rate limit
 * @param {Object} extra - Additional log data
 */
export function logRateLimit(req, limitType = 'general', extra = {}) {
  logger.warn({
    msg: 'Rate limit exceeded',
    limitType,
    requestId: req.requestId,
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    ...extra,
  });
}

/**
 * Performance timer utility
 * @param {string} operation - Operation name
 * @returns {Function} Timer end function
 */
export function createTimer(operation) {
  const startTime = process.hrtime.bigint();
  
  return (extra = {}) => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    logger.debug({
      msg: 'Performance timing',
      operation,
      duration,
      ...extra,
    });
    
    return duration;
  };
}

export default logger;