/**
 * Logger Configuration
 *
 * Bunyan logger setup with multiple streams
 * @author {{author}}
 */

const bunyan = require('bunyan');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const streams = [
  {
    level: 'error',
    path: path.join(logDir, 'error.log')
  },
  {
    level: 'info',
    path: path.join(logDir, 'combined.log')
  }
];

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  streams.push({
    level: 'info',
    stream: process.stdout
  });
}

const logger = bunyan.createLogger({
  name: '{{projectName}}',
  level: process.env.LOG_LEVEL || 'info',
  streams: streams
});

module.exports = logger;
