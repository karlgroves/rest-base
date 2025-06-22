/**
 * @fileoverview Graceful shutdown utilities for API Gateway
 * @module utils/shutdown
 * @requires ../services/redis.js
 * @requires ./logger.js
 */

import { disconnectRedis } from '../services/redis.js';
import logger from './logger.js';

let isShuttingDown = false;

/**
 * Setup graceful shutdown handlers
 * @param {Object} server - HTTP server instance
 * @param {number} timeout - Shutdown timeout in milliseconds
 */
export function gracefulShutdown(server, timeout = 30000) {
  const shutdown = async (signal) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal:', signal);
      return;
    }

    isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Set shutdown timeout
    const shutdownTimeout = setTimeout(() => {
      logger.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, timeout);

    try {
      // Stop accepting new connections
      server.close(async (error) => {
        if (error) {
          logger.error('Error closing server:', error);
        } else {
          logger.info('HTTP server closed');
        }

        try {
          // Close database connections
          await disconnectRedis();
          logger.info('Redis connection closed');

          // Clear shutdown timeout
          clearTimeout(shutdownTimeout);

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (cleanupError) {
          logger.error('Error during cleanup:', cleanupError);
          process.exit(1);
        }
      });

      // Stop processing new requests after a brief delay
      setTimeout(() => {
        logger.info('No longer accepting new requests');
      }, 1000);

    } catch (error) {
      logger.error('Error during shutdown:', error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });

  logger.info('Graceful shutdown handlers registered');
}

/**
 * Check if shutdown is in progress
 * @returns {boolean} Shutdown status
 */
export function isShutdownInProgress() {
  return isShuttingDown;
}

/**
 * Middleware to reject requests during shutdown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function rejectDuringShutdown(req, res, next) {
  if (isShuttingDown) {
    return res.status(503).json({
      error: 'Service is shutting down',
      code: 'SERVICE_SHUTTING_DOWN',
      message: 'Please try again later',
    });
  }
  next();
}