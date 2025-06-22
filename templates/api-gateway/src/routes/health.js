/**
 * @fileoverview Health check routes for API Gateway
 * @module routes/health
 * @requires express
 * @requires ../services/redis.js
 * @requires ../middleware/proxy.js
 * @requires ../middleware/errorHandler.js
 * @requires ../utils/logger.js
 */

import { Router } from "express";
import { isRedisConnected } from "../services/redis.js";
import {
  getRegisteredServices,
  createHealthCheckProxy,
} from "../middleware/proxy.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const {
  HealthChecker,
  HealthStatus,
} = require("../../../../shared/health-checker.js");

const router = Router();

// Initialize enhanced health checker for API Gateway
const healthChecker = new HealthChecker({
  timeout: 10000, // Longer timeout for upstream services
  retries: 2,
  thresholds: {
    memory: { warning: 0.8, critical: 0.95 },
    cpu: { warning: 0.7, critical: 0.9 },
    responseTime: { warning: 2000, critical: 5000 },
  },
});

// Register Redis health check
healthChecker.registerCheck(
  "redis",
  async () => {
    try {
      const connected = isRedisConnected();
      return {
        status: connected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        message: connected ? "Redis connected" : "Redis disconnected",
        data: { connected },
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: "Redis check failed",
        data: { error: error.message },
      };
    }
  },
  { critical: true },
);

// Register upstream service health checks
const registeredServices = getRegisteredServices();
registeredServices.forEach((service) => {
  healthChecker.registerCheck(
    `service-${service.name}`,
    HealthChecker.createExternalServiceCheck(`${service.url}/health`),
    { critical: false, timeout: 5000 },
  );
});

/**
 * Basic health check endpoint
 * GET /health
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const health = await healthChecker.checkHealth();

      // For API Gateway, we're more lenient with degraded services
      let statusCode = 200;
      if (health.status === HealthStatus.CRITICAL) {
        statusCode = 503;
      } else if (health.status === HealthStatus.UNHEALTHY) {
        // Only return 503 if critical services (Redis) are down
        const criticalDown =
          health.checks.redis?.status === HealthStatus.UNHEALTHY;
        statusCode = criticalDown ? 503 : 200;
      }

      res.status(statusCode).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: health.uptime,
        service: "{{projectName}}",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        gateway: {
          role: "api-gateway",
          upstreamServices: registeredServices.length,
          redisConnected: health.checks.redis?.status === HealthStatus.HEALTHY,
        },
      });
    } catch (error) {
      res.status(503).json({
        status: HealthStatus.CRITICAL,
        message: "Gateway health check failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

/**
 * Detailed health check with service dependencies
 * GET /health/detailed
 */
router.get(
  "/detailed",
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const registeredServices = getRegisteredServices();

    const detailedHealth = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "{{projectName}}",
      version: "1.0.0",
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
          status: isRedisConnected() ? "healthy" : "unhealthy",
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
          status: isHealthy ? "healthy" : "unhealthy",
          url: service.url,
          responseTime: Date.now() - healthCheckStartTime,
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        detailedHealth.services[service.name] = {
          status: "unhealthy",
          url: service.url,
          error: error.message,
          lastChecked: new Date().toISOString(),
        };
      }
    });

    await Promise.allSettled(serviceHealthPromises);

    // Determine overall status
    const hasUnhealthyDependencies = Object.values(
      detailedHealth.dependencies,
    ).some((dep) => dep.status === "unhealthy");

    const hasUnhealthyServices = Object.values(detailedHealth.services).some(
      (service) => service.status === "unhealthy",
    );

    if (hasUnhealthyDependencies || hasUnhealthyServices) {
      detailedHealth.status = "degraded";
    }

    detailedHealth.responseTime = Date.now() - startTime;

    const statusCode = detailedHealth.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  }),
);

/**
 * Readiness probe endpoint
 * GET /health/ready
 */
router.get(
  "/ready",
  asyncHandler(async (req, res) => {
    const readinessChecks = {
      redis: isRedisConnected(),
      services: true, // Could check if critical services are available
    };

    const isReady = Object.values(readinessChecks).every(
      (check) => check === true,
    );

    const response = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks: readinessChecks,
    };

    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json(response);
  }),
);

/**
 * Liveness probe endpoint
 * GET /health/live
 */
router.get("/live", (req, res) => {
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
router.get(
  "/service/:serviceName",
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const registeredServices = getRegisteredServices();
    const service = registeredServices.find((s) => s.name === serviceName);

    if (!service) {
      return res.status(404).json({
        error: `Service '${serviceName}' not found`,
        availableServices: registeredServices.map((s) => s.name),
      });
    }

    // Use the health check proxy to forward the request
    const healthProxy = createHealthCheckProxy(serviceName);
    return healthProxy(req, res);
  }),
);

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
      method: "GET",
      timeout: 5000,
    });

    return response.ok;
  } catch (error) {
    logger.warn(
      `Health check failed for service at ${serviceUrl}:`,
      error.message,
    );
    return false;
  }
}

export default router;
