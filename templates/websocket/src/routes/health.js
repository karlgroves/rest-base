/**
 * Health Check Routes
 *
 * Kubernetes-compatible health check endpoints
 * @author {{author}}
 */

const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// Simple health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: '{{projectName}}',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check
router.get('/detailed', (req, res) => {
  const memUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    service: '{{projectName}}',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });
});

// Kubernetes liveness probe
router.get('/live', (req, res) => {
  // Check if the application is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Kubernetes readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Add checks for external dependencies here
    // For example: database connection, Redis connection, etc.
    
    // For now, just check basic application state
    if (process.uptime() < 5) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'application starting up',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error({
      component: 'health',
      event: 'readiness_check_failed',
      err: error
    }, 'Readiness check failed');

    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Kubernetes startup probe
router.get('/startup', (req, res) => {
  // Check if the application has started successfully
  if (process.uptime() > 10) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

module.exports = router;