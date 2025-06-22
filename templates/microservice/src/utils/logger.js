/**
 * Logger Configuration
 *
 * Bunyan-based logging setup for the microservice
 * @author {{author}}
 */

const bunyan = require('bunyan');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure log streams
const streams = [
  // Console stream for development
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    stream: process.stdout
  },
  
  // Main log file with rotation
  {
    level: 'info',
    type: 'rotating-file',
    path: path.join(logsDir, 'app.log'),
    period: '1d',
    count: 5
  },
  
  // Error log file
  {
    level: 'error',
    type: 'rotating-file',
    path: path.join(logsDir, 'error.log'),
    period: '1d',
    count: 3
  }
];

// Create logger instance
const logger = bunyan.createLogger({
  name: '{{projectName}}',
  streams,
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res,
    err: bunyan.stdSerializers.err
  },
  // Default fields
  service: '{{projectName}}',
  environment: process.env.NODE_ENV || 'development',
  version: '1.0.0'
});

// Custom log methods for common use cases
logger.request = (req, res, responseTime) => {
  logger.info({
    req,
    res,
    responseTime,
    component: 'http'
  }, 'HTTP Request completed');
};

logger.database = (operation, duration, details = {}) => {
  logger.debug({
    operation,
    duration,
    component: 'database',
    ...details
  }, 'Database operation completed');
};

logger.security = (event, details = {}) => {
  logger.warn({
    event,
    component: 'security',
    timestamp: new Date().toISOString(),
    ...details
  }, 'Security event occurred');
};

logger.performance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level]({
    operation,
    duration,
    component: 'performance',
    ...details
  }, 'Performance metric recorded');
};

// Helper method for structured error logging
logger.errorWithContext = (error, context = {}) => {
  logger.error({
    err: error,
    component: 'application',
    ...context
  }, 'Application error occurred');
};

// Helper method for API response logging
logger.apiResponse = (req, res, data = null) => {
  logger.info({
    req,
    res,
    hasData: !!data,
    dataSize: data ? JSON.stringify(data).length : 0,
    component: 'api'
  }, 'API response sent');
};

// Add child logger creation method
logger.child = (options = {}) => {
  return logger.child({
    ...options,
    pid: process.pid
  });
};

module.exports = logger;