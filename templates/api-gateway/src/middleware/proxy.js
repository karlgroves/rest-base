/**
 * @fileoverview Proxy middleware for API Gateway
 * @module middleware/proxy
 * @requires http-proxy-middleware
 * @requires ../config/gateway.js
 * @requires ../utils/logger.js
 */

import { createProxyMiddleware } from 'http-proxy-middleware';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Service registry for dynamic service discovery
 * In production, this could be replaced with actual service discovery
 */
const serviceRegistry = new Map([
  ['auth', { url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001', timeout: 30000 }],
  ['users', { url: process.env.USERS_SERVICE_URL || 'http://localhost:3002', timeout: 30000 }],
  ['products', { url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003', timeout: 30000 }],
  ['orders', { url: process.env.ORDERS_SERVICE_URL || 'http://localhost:3004', timeout: 30000 }],
]);

/**
 * Get service configuration by name
 * @param {string} serviceName - Name of the service
 * @returns {Object|null} Service configuration or null if not found
 */
function getServiceConfig(serviceName) {
  return serviceRegistry.get(serviceName) || null;
}

/**
 * Create proxy middleware for a specific service
 * @param {string} serviceName - Name of the target service
 * @param {Object} options - Additional proxy options
 * @returns {Function} Proxy middleware function
 */
export function createServiceProxy(serviceName, options = {}) {
  const serviceConfig = getServiceConfig(serviceName);
  
  if (!serviceConfig) {
    throw new Error(`Service '${serviceName}' not found in registry`);
  }

  const defaultOptions = {
    target: serviceConfig.url,
    changeOrigin: true,
    timeout: serviceConfig.timeout,
    proxyTimeout: serviceConfig.timeout,
    pathRewrite: {
      [`^/api/v1/${serviceName}`]: '', // Remove service prefix from forwarded request
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for service '${serviceName}':`, {
        error: err.message,
        url: req.url,
        method: req.method,
      });

      if (!res.headersSent) {
        res.status(502).json({
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          service: serviceName,
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add custom headers
      proxyReq.setHeader('X-Gateway-Source', '{{projectName}}');
      proxyReq.setHeader('X-Request-ID', req.requestId || generateRequestId());
      
      // Forward user information if available
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles || []));
      }

      logger.debug(`Proxying request to ${serviceName}:`, {
        method: req.method,
        url: req.url,
        target: `${serviceConfig.url}${proxyReq.path}`,
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add response headers
      proxyRes.headers['X-Gateway-Service'] = serviceName;
      proxyRes.headers['X-Response-Time'] = Date.now() - req.startTime;

      logger.debug(`Response from ${serviceName}:`, {
        status: proxyRes.statusCode,
        url: req.url,
        responseTime: Date.now() - req.startTime,
      });
    },
  };

  return createProxyMiddleware({ ...defaultOptions, ...options });
}

/**
 * Health check proxy for services
 * @param {string} serviceName - Name of the service to check
 * @returns {Function} Express middleware function
 */
export function createHealthCheckProxy(serviceName) {
  const serviceConfig = getServiceConfig(serviceName);
  
  if (!serviceConfig) {
    return (req, res) => {
      res.status(404).json({
        error: `Service '${serviceName}' not found`,
        code: 'SERVICE_NOT_FOUND',
      });
    };
  }

  return createProxyMiddleware({
    target: serviceConfig.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/health/${serviceName}`]: '/health',
    },
    timeout: 5000,
    onError: (err, req, res) => {
      logger.warn(`Health check failed for service '${serviceName}':`, err.message);
      
      if (!res.headersSent) {
        res.status(503).json({
          service: serviceName,
          status: 'unhealthy',
          error: err.message,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });
}

/**
 * Dynamic service proxy middleware
 * Routes requests based on the service name in the URL path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function dynamicServiceProxy(req, res, next) {
  // Extract service name from URL path (e.g., /api/v1/users/123 -> users)
  const pathParts = req.path.split('/');
  const serviceName = pathParts[3]; // Assuming /api/v1/{service}/...

  if (!serviceName) {
    return res.status(400).json({
      error: 'Service name not specified in request path',
      code: 'INVALID_SERVICE_PATH',
    });
  }

  const serviceConfig = getServiceConfig(serviceName);
  if (!serviceConfig) {
    return res.status(404).json({
      error: `Service '${serviceName}' not found`,
      code: 'SERVICE_NOT_FOUND',
      availableServices: Array.from(serviceRegistry.keys()),
    });
  }

  // Create and execute proxy middleware
  const proxyMiddleware = createServiceProxy(serviceName);
  return proxyMiddleware(req, res, next);
}

/**
 * Generate unique request ID
 * @returns {string} Unique request identifier
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add service to registry (for dynamic service discovery)
 * @param {string} serviceName - Name of the service
 * @param {string} serviceUrl - URL of the service
 * @param {number} timeout - Request timeout in milliseconds
 */
export function registerService(serviceName, serviceUrl, timeout = 30000) {
  serviceRegistry.set(serviceName, { url: serviceUrl, timeout });
  logger.info(`Service '${serviceName}' registered at ${serviceUrl}`);
}

/**
 * Remove service from registry
 * @param {string} serviceName - Name of the service to remove
 */
export function unregisterService(serviceName) {
  const removed = serviceRegistry.delete(serviceName);
  if (removed) {
    logger.info(`Service '${serviceName}' unregistered`);
  }
  return removed;
}

/**
 * Get all registered services
 * @returns {Array<Object>} List of registered services
 */
export function getRegisteredServices() {
  return Array.from(serviceRegistry.entries()).map(([name, config]) => ({
    name,
    url: config.url,
    timeout: config.timeout,
  }));
}