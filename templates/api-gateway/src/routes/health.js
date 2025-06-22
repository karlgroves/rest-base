/**
 * @fileoverview Health check routes for API Gateway
 * @module routes/health
 * @requires express
 * @requires ../services/redis.js
 * @requires ../middleware/proxy.js
 * @requires ../middleware/errorHandler.js
 * @requires ../utils/logger.js
 */

import { Router } from 'express';
import { isRedisConnected } from '../services/redis.js';
import { getRegisteredServices, createHealthCheckProxy } from '../middleware/proxy.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '{{projectName}}',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      redis: {
        status: isRedisConnected() ? 'healthy' : 'unhealthy',
        responseTime: null,
      },
      memory: {
        status: 'healthy',
        usage: process.memoryUsage(),
      },
      services: {},
    },
  };

  // Check Redis connectivity
  try {
    const redisStartTime = Date.now();
    if (isRedisConnected()) {
      healthStatus.checks.redis.responseTime = Date.now() - redisStartTime;
    } else {
      healthStatus.status = 'degraded';
      healthStatus.checks.redis.error = 'Redis connection not available';
    }
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.checks.redis.status = 'unhealthy';
    healthStatus.checks.redis.error = error.message;
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 500 * 1024 * 1024; // 500MB threshold
  
  if (memoryUsage.heapUsed > memoryThreshold) {
    healthStatus.status = 'degraded';
    healthStatus.checks.memory.status = 'warning';
    healthStatus.checks.memory.warning = 'High memory usage detected';
  }

  healthStatus.responseTime = Date.now() - startTime;

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}));

/**
 * Detailed health check with service dependencies
 * GET /health/detailed
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const registeredServices = getRegisteredServices();
  
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '{{projectName}}',
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    dependencies: {
      redis: {
        status: isRedisConnected() ? 'healthy' : 'unhealthy',
        connection: isRedisConnected(),
      },
    },
    services: {},
  };

  // Check each registered service health
  const serviceHealthPromises = registeredServices.map(async (service) => {
    try {
      const healthCheckStartTime = Date.now();
      
      // This would typically make an HTTP request to the service's health endpoint
      // For now, we'll simulate the check
      const isHealthy = await checkServiceHealth(service.url);
      
      detailedHealth.services[service.name] = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        url: service.url,
        responseTime: Date.now() - healthCheckStartTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      detailedHealth.services[service.name] = {
        status: 'unhealthy',
        url: service.url,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  });

  await Promise.allSettled(serviceHealthPromises);

  // Determine overall status
  const hasUnhealthyDependencies = Object.values(detailedHealth.dependencies)
    .some(dep => dep.status === 'unhealthy');
  
  const hasUnhealthyServices = Object.values(detailedHealth.services)
    .some(service => service.status === 'unhealthy');

  if (hasUnhealthyDependencies || hasUnhealthyServices) {
    detailedHealth.status = 'degraded';
  }

  detailedHealth.responseTime = Date.now() - startTime;

  const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(detailedHealth);
}));

/**
 * Readiness probe endpoint
 * GET /health/ready
 */
router.get('/ready', asyncHandler(async (req, res) => {
  const readinessChecks = {
    redis: isRedisConnected(),
    services: true, // Could check if critical services are available
  };

  const isReady = Object.values(readinessChecks).every(check => check === true);

  const response = {
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks: readinessChecks,
  };

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(response);
}));

/**
 * Liveness probe endpoint
 * GET /health/live
 */
router.get('/live', (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Individual service health check
 * GET /health/service/:serviceName
 */
router.get('/service/:serviceName', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  const registeredServices = getRegisteredServices();
  const service = registeredServices.find(s => s.name === serviceName);

  if (!service) {
    return res.status(404).json({
      error: `Service '${serviceName}' not found`,
      availableServices: registeredServices.map(s => s.name),
    });
  }

  // Use the health check proxy to forward the request
  const healthProxy = createHealthCheckProxy(serviceName);
  return healthProxy(req, res);
}));

/**
 * Check if a service is healthy (utility function)
 * @param {string} serviceUrl - Service URL to check
 * @returns {Promise<boolean>} Health status
 */
async function checkServiceHealth(serviceUrl) {
  try {
    // In a real implementation, you would make an HTTP request to the service
    // For this template, we'll simulate the check
    const response = await fetch(`${serviceUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    return response.ok;
  } catch (error) {
    logger.warn(`Health check failed for service at ${serviceUrl}:`, error.message);
    return false;
  }
}

export default router;