/**
 * @fileoverview Redis connection and utilities for API Gateway
 * @module services/redis
 * @requires redis
 * @requires ../config/index.js
 * @requires ../utils/logger.js
 */

import { createClient } from 'redis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

/**
 * Redis client configuration
 */
const redisConfig = {
  url: config.redis.url,
  socket: {
    connectTimeout: 5000,
    lazyConnect: true,
    reconnectDelay: 1000,
  },
  retryDelayOnFailover: 100,
  enableAutoPipelining: true,
  maxRetriesPerRequest: 3,
};

/**
 * Connect to Redis
 * @async
 * @returns {Promise<Object>} Redis client instance
 */
export async function connectRedis() {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient(redisConfig);

    // Event listeners
    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client connected and ready');
      isConnected = true;
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
      isConnected = false;
    });

    redisClient.on('end', () => {
      logger.warn('Redis client connection ended');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection test successful');

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    isConnected = false;
    throw error;
  }
}

/**
 * Get Redis client instance
 * @returns {Object|null} Redis client or null if not connected
 */
export function getRedisClient() {
  if (!redisClient || !isConnected) {
    logger.warn('Redis client not available');
    return null;
  }
  return redisClient;
}

/**
 * Check if Redis is connected
 * @returns {boolean} Connection status
 */
export function isRedisConnected() {
  return isConnected && redisClient?.isReady;
}

/**
 * Disconnect from Redis
 * @async
 * @returns {Promise<void>}
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting Redis client:', error);
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
}

/**
 * Redis key utilities
 */
export const RedisKeys = {
  /**
   * Generate rate limit key
   * @param {string} identifier - Rate limit identifier
   * @returns {string} Redis key
   */
  rateLimit: (identifier) => `rate_limit:${identifier}`,

  /**
   * Generate session key
   * @param {string} sessionId - Session identifier
   * @returns {string} Redis key
   */
  session: (sessionId) => `session:${sessionId}`,

  /**
   * Generate cache key
   * @param {string} resource - Resource identifier
   * @returns {string} Redis key
   */
  cache: (resource) => `cache:${resource}`,

  /**
   * Generate lock key
   * @param {string} lockId - Lock identifier
   * @returns {string} Redis key
   */
  lock: (lockId) => `lock:${lockId}`,

  /**
   * Generate service health key
   * @param {string} serviceName - Service name
   * @returns {string} Redis key
   */
  serviceHealth: (serviceName) => `health:${serviceName}`,
};

/**
 * Redis cache utilities
 */
export const RedisCache = {
  /**
   * Set cache value with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @async
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = 3600) {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error('Redis cache set error:', error);
      return false;
    }
  },

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @async
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    try {
      const client = getRedisClient();
      if (!client) return null;

      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis cache get error:', error);
      return null;
    }
  },

  /**
   * Delete cache value
   * @param {string} key - Cache key
   * @async
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis cache delete error:', error);
      return false;
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @async
   * @returns {Promise<boolean>} Existence status
   */
  async exists(key) {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis cache exists error:', error);
      return false;
    }
  },

  /**
   * Set multiple values
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} ttl - Time to live in seconds
   * @async
   * @returns {Promise<boolean>} Success status
   */
  async mset(keyValuePairs, ttl = 3600) {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const pipeline = client.multi();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Redis cache mset error:', error);
      return false;
    }
  },
};

/**
 * Redis pub/sub utilities
 */
export const RedisPubSub = {
  /**
   * Publish message to channel
   * @param {string} channel - Channel name
   * @param {any} message - Message to publish
   * @async
   * @returns {Promise<boolean>} Success status
   */
  async publish(channel, message) {
    try {
      const client = getRedisClient();
      if (!client) return false;

      const serializedMessage = JSON.stringify(message);
      await client.publish(channel, serializedMessage);
      return true;
    } catch (error) {
      logger.error('Redis publish error:', error);
      return false;
    }
  },

  /**
   * Subscribe to channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Message handler
   * @async
   * @returns {Promise<boolean>} Success status
   */
  async subscribe(channel, callback) {
    try {
      const client = getRedisClient();
      if (!client) return false;

      await client.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          logger.error('Error parsing Redis message:', error);
          callback(message);
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Redis subscribe error:', error);
      return false;
    }
  },
};