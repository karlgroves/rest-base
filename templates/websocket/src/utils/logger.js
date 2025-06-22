/**
 * Logger Configuration
 *
 * Bunyan-based structured logging
 * @author {{author}}
 */

const bunyan = require('bunyan');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Create rotating file streams
const streams = [
  {
    level: 'info',
    stream: process.stdout
  }
];

// Add file streams in non-test environments
if (process.env.NODE_ENV !== 'test') {
  streams.push(
    {
      level: 'info',
      type: 'rotating-file',
      path: path.join(logsDir, 'app.log'),
      period: '1d',
      count: 7
    },
    {
      level: 'error',
      type: 'rotating-file',
      path: path.join(logsDir, 'error.log'),
      period: '1d',
      count: 14
    }
  );
}

// Create logger instance
const logger = bunyan.createLogger({
  name: '{{projectName}}',
  level: LOG_LEVEL,
  streams,
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res,
    err: bunyan.stdSerializers.err
  }
});

// Add custom methods for common patterns
logger.logRequest = (req, res, responseTime) => {
  logger.info({
    component: 'http',
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`
  }, 'HTTP Request');
};

logger.logSocketEvent = (event, socket, data = {}) => {
  logger.info({
    component: 'websocket',
    event,
    socketId: socket.id,
    userId: socket.userId,
    ...data
  }, `Socket event: ${event}`);
};

logger.logError = (error, context = {}) => {
  logger.error({
    err: error,
    ...context
  }, error.message || 'An error occurred');
};

module.exports = logger;