/**
 * @fileoverview Rate limiting middleware for API Gateway
 * @module middleware/rateLimiter
 * @requires express-rate-limit
 * @requires rate-limit-redis
 * @requires ../services/redis.js
 * @requires ../config/index.js
 * @requires ../utils/logger.js
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import config from '../config/index.js';
import { getRedisClient } from '../services/redis.js';
import logger from '../utils/logger.js';

/**
 * Create rate limiter middleware with Redis store
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.message - Error message for rate limit exceeded
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 * @returns {Function} Express middleware function
 */
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use IP address and user ID if available for more granular limiting
      const userId = req.user?.id || 'anonymous';
      return `rate_limit:${req.ip}:${userId}`;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    onLimitReached: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    },
  };

  const limiterOptions = { ...defaultOptions, ...options };

  // Use Redis store if available
  try {
    const redisClient = getRedisClient();
    if (redisClient) {
      limiterOptions.store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      });
    }
  } catch (error) {
    logger.warn('Redis not available for rate limiting, using in-memory store');
  }

  return rateLimit(limiterOptions);
}

/**
 * Default rate limiter for general API endpoints
 */
export const generalRateLimit = createRateLimiter();

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900,
  },
  keyGenerator: (req) => `auth_rate_limit:${req.ip}`,
});

/**
 * More lenient rate limiter for public endpoints
 */
export const publicRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    error: 'Too many requests, please try again later.',
    code: 'PUBLIC_RATE_LIMIT_EXCEEDED',
    retryAfter: 900,
  },
});

/**
 * Create custom rate limiter for specific routes
 * @param {number} max - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} prefix - Key prefix for Redis
 * @returns {Function} Rate limiter middleware
 */
export function createCustomRateLimit(max, windowMs, prefix = 'custom') {
  return createRateLimiter({
    max,
    windowMs,
    keyGenerator: (req) => {
      const userId = req.user?.id || 'anonymous';
      return `${prefix}_rate_limit:${req.ip}:${userId}`;
    },
  });
}