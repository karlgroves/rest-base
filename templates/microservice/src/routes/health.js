/**
 * Health Check Routes for Microservice
 *
 * Health endpoints optimized for microservice architecture
 * @author {{author}}
 */

const express = require('express');
const { HealthChecker, HealthStatus } = require('../../../../shared/health-checker');
const config = require('../config');

const router = express.Router();

// Initialize health checker for microservice
const healthChecker = new HealthChecker({
  timeout: 5000,
  retries: 1,
  thresholds: {
    memory: { warning: 0.8, critical: 0.95 },
    cpu: { warning: 0.7, critical: 0.9 },
    responseTime: { warning: 1000, critical: 3000 }
  }
});

// Register database health check if configured
if (config.database.url || config.database.host) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: config.database.url || {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl
    },
    ...config.database.pool
  });

  healthChecker.registerCheck(
    'database',
    HealthChecker.createDatabaseCheck(pool, 'postgresql'),
    { critical: true, timeout: 3000 }
  );
}

// Register Redis health check if configured
if (config.redis.url || config.redis.host) {
  const redis = require('redis');
  const client = redis.createClient({
    url: config.redis.url || `redis://${config.redis.host}:${config.redis.port}`,
    password: config.redis.password,
    database: config.redis.db
  });

  healthChecker.registerCheck(
    'redis',
    HealthChecker.createDatabaseCheck(client, 'redis'),
    { critical: false, timeout: 2000 }
  );
}

// Register external service health checks
Object.entries(config.services).forEach(([serviceName, serviceUrl]) => {
  if (serviceUrl) {
    healthChecker.registerCheck(
      serviceName,
      HealthChecker.createExternalServiceCheck(`${serviceUrl}/health`),
      { critical: serviceName.includes('auth'), timeout: 3000 }
    );
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns the basic health status of the microservice
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy, critical]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     readable:
 *                       type: string
 *                     seconds:
 *                       type: number
 *                 service:
 *                   type: string
 *                 version:
 *                   type: string
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
  try {
    const health = await healthChecker.checkHealth();
    
    let statusCode = 200;
    switch (health.status) {
      case HealthStatus.HEALTHY:
      case HealthStatus.DEGRADED:
        statusCode = 200;
        break;
      case HealthStatus.UNHEALTHY:
      case HealthStatus.CRITICAL:
        statusCode = 503;
        break;
      default:
        statusCode = 503;
    }

    res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      service: '{{projectName}}',
      version: '1.0.0',
      environment: config.server.environment
    });
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.CRITICAL,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed health information including all components
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *       503:
 *         description: Service is unhealthy
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await healthChecker.checkHealth();
    
    let statusCode = 200;
    if (health.status === HealthStatus.UNHEALTHY || health.status === HealthStatus.CRITICAL) {
      statusCode = 503;
    }

    res.status(statusCode).json({
      ...health,
      service: '{{projectName}}',
      version: '1.0.0',
      environment: config.server.environment,
      hostname: require('os').hostname(),
      pid: process.pid,
      nodeVersion: process.version
    });
  } catch (error) {
    res.status(503).json({
      status: HealthStatus.CRITICAL,
      message: 'Detailed health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: '{{projectName}}',
    pid: process.pid
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to serve traffic
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check only critical components for readiness
    const criticalChecks = healthChecker.getCheckInfo()
      .filter(check => check.critical)
      .map(check => check.name);

    const health = await healthChecker.checkHealth(criticalChecks);
    
    const ready = health.status === HealthStatus.HEALTHY || health.status === HealthStatus.DEGRADED;
    
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not-ready',
      timestamp: health.timestamp,
      checks: health.checks,
      criticalServices: criticalChecks.length
    });
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      message: 'Readiness check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /health/startup:
 *   get:
 *     summary: Startup probe
 *     description: Kubernetes startup probe endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service has started successfully
 *       503:
 *         description: Service is still starting
 */
router.get('/startup', async (req, res) => {
  try {
    const startupChecks = ['system', 'memory'];
    const health = await healthChecker.checkHealth(startupChecks);
    
    const started = health.status !== HealthStatus.CRITICAL;
    
    res.status(started ? 200 : 503).json({
      status: started ? 'started' : 'starting',
      timestamp: health.timestamp,
      uptime: health.uptime,
      checks: health.checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'starting',
      message: 'Startup check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;