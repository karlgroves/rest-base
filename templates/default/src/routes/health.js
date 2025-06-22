/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring system status,
 * dependencies, and application health.
 *
 * @author Karl Groves
 */

const express = require('express');
const { HealthChecker, HealthStatus } = require('../../../../shared/health-checker');

const router = express.Router();

// Initialize health checker
const healthChecker = new HealthChecker({
  timeout: 5000,
  retries: 1,
  thresholds: {
    memory: { warning: 0.8, critical: 0.95 },
    cpu: { warning: 0.7, critical: 0.9 },
    responseTime: { warning: 1000, critical: 5000 }
  }
});

// Register database health check if database is configured
if (process.env.DATABASE_URL || process.env.DB_HOST) {
  const { Pool } = require('pg'); // Assuming PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'app_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    }
  });

  healthChecker.registerCheck('database', HealthChecker.createDatabaseCheck(pool, 'postgresql'), {
    critical: true,
    timeout: 3000
  });
}

// Register Redis health check if Redis is configured
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  const redis = require('redis');
  const client = redis.createClient({
    url:
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
  });

  healthChecker.registerCheck('redis', HealthChecker.createDatabaseCheck(client, 'redis'), {
    critical: false,
    timeout: 2000
  });
}

// Register external service checks
const externalServices = [
  { name: 'auth-service', url: process.env.AUTH_SERVICE_URL },
  { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL },
  { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL }
].filter(service => service.url);

externalServices.forEach(service => {
  healthChecker.registerCheck(
    service.name,
    HealthChecker.createExternalServiceCheck(`${service.url}/health`),
    { critical: false, timeout: 3000 }
  );
});

/**
 * GET /health
 * Basic health check endpoint
 * Returns 200 if application is healthy, 503 if unhealthy
 */
router.get('/', async (req, res) => {
  try {
    const health = await healthChecker.checkHealth();

    // Determine HTTP status based on health
    let statusCode = 200;
    switch (health.status) {
      case HealthStatus.HEALTHY:
        statusCode = 200;
        break;
      case HealthStatus.DEGRADED:
        statusCode = 200; // Still operational
        break;
      case HealthStatus.UNHEALTHY:
        statusCode = 503;
        break;
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
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
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
 * GET /health/detailed
 * Detailed health check with all component statuses
 * Includes individual check results and system metrics
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await healthChecker.checkHealth();

    // Determine HTTP status
    let statusCode = 200;
    if (health.status === HealthStatus.UNHEALTHY || health.status === HealthStatus.CRITICAL) {
      statusCode = 503;
    }

    res.status(statusCode).json({
      ...health,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      hostname: require('os').hostname(),
      pid: process.pid
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
 * GET /health/live
 * Kubernetes-style liveness probe
 * Returns 200 if application is running (even if degraded)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * GET /health/ready
 * Kubernetes-style readiness probe
 * Returns 200 only if application is ready to serve traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check only critical components for readiness
    const criticalChecks = healthChecker
      .getCheckInfo()
      .filter(check => check.critical)
      .map(check => check.name);

    const health = await healthChecker.checkHealth(criticalChecks);

    const ready = health.status === HealthStatus.HEALTHY || health.status === HealthStatus.DEGRADED;

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not-ready',
      timestamp: health.timestamp,
      checks: health.checks,
      critical: criticalChecks.length
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
 * GET /health/startup
 * Kubernetes-style startup probe
 * Returns 200 when application has started successfully
 */
router.get('/startup', async (req, res) => {
  try {
    // Simple startup check - verify core functionality
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

/**
 * GET /health/check/:name
 * Check specific component health
 */
router.get('/check/:name', async (req, res) => {
  try {
    const checkName = req.params.name;
    const availableChecks = healthChecker.getCheckInfo().map(c => c.name);

    if (!availableChecks.includes(checkName)) {
      return res.status(404).json({
        error: 'Check not found',
        available: availableChecks,
        requested: checkName
      });
    }

    const health = await healthChecker.checkHealth([checkName]);
    const checkResult = health.checks[checkName];

    if (!checkResult) {
      return res.status(404).json({
        error: 'Check result not found',
        check: checkName
      });
    }

    const statusCode =
      checkResult.status === HealthStatus.HEALTHY || checkResult.status === HealthStatus.DEGRADED
        ? 200
        : 503;

    res.status(statusCode).json(checkResult);
  } catch (error) {
    res.status(503).json({
      error: 'Check execution failed',
      message: error.message,
      check: req.params.name,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/info
 * Returns information about available health checks
 */
router.get('/info', (req, res) => {
  const checks = healthChecker.getCheckInfo();
  const lastResults = healthChecker.getLastResults();

  res.json({
    checks: checks.map(check => ({
      ...check,
      lastResult: lastResults[check.name]
        ? {
            status: lastResults[check.name].status,
            timestamp: lastResults[check.name].timestamp,
            duration: lastResults[check.name].duration
          }
        : null
    })),
    endpoints: [
      { path: '/health', description: 'Basic health status' },
      { path: '/health/detailed', description: 'Detailed health information' },
      { path: '/health/live', description: 'Liveness probe' },
      { path: '/health/ready', description: 'Readiness probe' },
      { path: '/health/startup', description: 'Startup probe' },
      { path: '/health/check/:name', description: 'Individual component check' },
      { path: '/health/info', description: 'Health check information' }
    ]
  });
});

module.exports = router;
