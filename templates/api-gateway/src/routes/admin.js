/**
 * @fileoverview Admin routes for API Gateway management
 * @module routes/admin
 * @requires express
 * @requires ../middleware/auth.js
 * @requires ../middleware/rateLimiter.js
 * @requires ../middleware/errorHandler.js
 * @requires ../services/redis.js
 * @requires ../middleware/proxy.js
 * @requires ../utils/logger.js
 */

import { Router } from 'express';
import { jwtAuth, requireRoles } from '../middleware/auth.js';
import { createCustomRateLimit } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getRedisClient, RedisCache } from '../services/redis.js';
import { 
  getRegisteredServices, 
  registerService, 
  unregisterService 
} from '../middleware/proxy.js';
import logger from '../utils/logger.js';

const router = Router();

// Admin endpoints require authentication and admin role
router.use(jwtAuth);
router.use(requireRoles(['admin']));
router.use(createCustomRateLimit(100, 15 * 60 * 1000, 'admin'));

/**
 * Admin dashboard information
 * GET /admin
 */
router.get('/', asyncHandler(async (req, res) => {
  const registeredServices = getRegisteredServices();
  const redisClient = getRedisClient();
  
  const dashboardInfo = {
    gateway: {
      name: '{{projectName}}',
      version: '1.0.0',
      status: 'operational',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    services: {
      registered: registeredServices.length,
      list: registeredServices,
    },
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
    redis: {
      connected: redisClient ? true : false,
      status: redisClient ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  };

  res.json(dashboardInfo);
}));

/**
 * Service management endpoints
 */

/**
 * Get all registered services
 * GET /admin/services
 */
router.get('/services', (req, res) => {
  const registeredServices = getRegisteredServices();
  res.json({
    services: registeredServices,
    total: registeredServices.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Register a new service
 * POST /admin/services
 */
router.post('/services', asyncHandler(async (req, res) => {
  const { name, url, timeout = 30000 } = req.body;

  if (!name || !url) {
    return res.status(400).json({
      error: 'Service name and URL are required',
      code: 'MISSING_REQUIRED_FIELDS',
    });
  }

  try {
    registerService(name, url, timeout);
    
    logger.info(`Service registered by admin: ${name} -> ${url}`, {
      adminUser: req.user.id,
      serviceName: name,
      serviceUrl: url,
    });

    res.status(201).json({
      message: 'Service registered successfully',
      service: { name, url, timeout },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      code: 'SERVICE_REGISTRATION_FAILED',
    });
  }
}));

/**
 * Unregister a service
 * DELETE /admin/services/:serviceName
 */
router.delete('/services/:serviceName', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  
  const removed = unregisterService(serviceName);
  
  if (!removed) {
    return res.status(404).json({
      error: `Service '${serviceName}' not found`,
      code: 'SERVICE_NOT_FOUND',
    });
  }

  logger.info(`Service unregistered by admin: ${serviceName}`, {
    adminUser: req.user.id,
    serviceName,
  });

  res.json({
    message: 'Service unregistered successfully',
    serviceName,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Cache management endpoints
 */

/**
 * Get cache statistics
 * GET /admin/cache
 */
router.get('/cache', asyncHandler(async (req, res) => {
  const redisClient = getRedisClient();
  
  if (!redisClient) {
    return res.status(503).json({
      error: 'Redis not available',
      code: 'REDIS_UNAVAILABLE',
    });
  }

  try {
    const info = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');
    
    res.json({
      redis: {
        memory: info,
        keyspace: keyspace,
        connected: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache statistics',
      code: 'CACHE_STATS_ERROR',
      details: error.message,
    });
  }
}));

/**
 * Clear cache by pattern
 * DELETE /admin/cache
 */
router.delete('/cache', asyncHandler(async (req, res) => {
  const { pattern = '*' } = req.query;
  const redisClient = getRedisClient();
  
  if (!redisClient) {
    return res.status(503).json({
      error: 'Redis not available',
      code: 'REDIS_UNAVAILABLE',
    });
  }

  try {
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    logger.info(`Cache cleared by admin: pattern=${pattern}, keys=${keys.length}`, {
      adminUser: req.user.id,
      pattern,
      keysDeleted: keys.length,
    });

    res.json({
      message: 'Cache cleared successfully',
      pattern,
      keysDeleted: keys.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      code: 'CACHE_CLEAR_ERROR',
      details: error.message,
    });
  }
}));

/**
 * Metrics and monitoring endpoints
 */

/**
 * Get gateway metrics
 * GET /admin/metrics
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    eventLoop: {
      delay: process.hrtime.bigint ? Number(process.hrtime.bigint()) : 0,
    },
    requests: {
      // In a real implementation, you would track these metrics
      total: 0,
      errors: 0,
      averageResponseTime: 0,
    },
    services: getRegisteredServices().map(service => ({
      name: service.name,
      url: service.url,
      // In a real implementation, you would track service-specific metrics
      requests: 0,
      errors: 0,
      averageResponseTime: 0,
    })),
  };

  res.json(metrics);
}));

/**
 * Get system logs
 * GET /admin/logs
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const { level = 'info', limit = 100 } = req.query;
  
  // In a real implementation, you would retrieve logs from your logging system
  // This is a placeholder response
  res.json({
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Gateway started successfully',
        requestId: 'req_12345',
      },
      // ... more log entries
    ],
    filter: { level, limit: Number(limit) },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Configuration management
 */

/**
 * Get current configuration
 * GET /admin/config
 */
router.get('/config', (req, res) => {
  // Return safe configuration (excluding secrets)
  const safeConfig = {
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 8080,
    corsOrigins: process.env.CORS_ORIGINS,
    trustProxy: process.env.TRUST_PROXY,
    logLevel: process.env.LOG_LEVEL,
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS,
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    },
    bodyParser: {
      jsonLimit: process.env.BODY_PARSER_JSON_LIMIT,
      urlencodedLimit: process.env.BODY_PARSER_URLENCODED_LIMIT,
    },
  };

  res.json({
    config: safeConfig,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check for admin endpoints
 * GET /admin/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'admin-api',
    timestamp: new Date().toISOString(),
    user: req.user.id,
  });
});

export default router;