/**
 * @fileoverview API proxy routes for API Gateway
 * @module routes/proxy
 * @requires express
 * @requires ../middleware/auth.js
 * @requires ../middleware/proxy.js
 * @requires ../middleware/rateLimiter.js
 * @requires ../middleware/errorHandler.js
 * @requires ../utils/logger.js
 */

import { Router } from 'express';
import { jwtAuth, optionalJwtAuth, requireRoles, requirePermissions } from '../middleware/auth.js';
import { 
  createServiceProxy, 
  dynamicServiceProxy, 
  getRegisteredServices 
} from '../middleware/proxy.js';
import { createCustomRateLimit } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * API information endpoint
 * GET /api
 */
router.get('/', (req, res) => {
  const registeredServices = getRegisteredServices();
  
  res.json({
    name: '{{projectName}} API Gateway',
    version: '1.0.0',
    description: 'API Gateway for microservices architecture',
    timestamp: new Date().toISOString(),
    availableVersions: ['v1'],
    registeredServices: registeredServices.map(service => ({
      name: service.name,
      endpoint: `/api/v1/${service.name}`,
    })),
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes',
      public: '1000 requests per 15 minutes',
    },
  });
});

/**
 * API v1 routes
 */
const v1Router = Router();

/**
 * Public endpoints (no authentication required)
 */
v1Router.use('/public/*', optionalJwtAuth);

/**
 * Authentication endpoints (special rate limiting)
 */
v1Router.use('/auth/*', asyncHandler(async (req, res, next) => {
  // Forward to auth service
  const authProxy = createServiceProxy('auth');
  return authProxy(req, res, next);
}));

/**
 * Protected endpoints requiring authentication
 */
v1Router.use('/users/*', jwtAuth, asyncHandler(async (req, res, next) => {
  // Forward to users service
  const usersProxy = createServiceProxy('users');
  return usersProxy(req, res, next);
}));

/**
 * Admin endpoints requiring admin role
 */
v1Router.use('/admin/*', 
  jwtAuth, 
  requireRoles(['admin']),
  createCustomRateLimit(50, 15 * 60 * 1000, 'admin'), // 50 requests per 15 minutes
  asyncHandler(async (req, res, next) => {
    // Forward to admin service or handle admin operations
    const adminProxy = createServiceProxy('admin');
    return adminProxy(req, res, next);
  })
);

/**
 * Products endpoints with optional authentication
 */
v1Router.use('/products/*', optionalJwtAuth, asyncHandler(async (req, res, next) => {
  // Forward to products service
  const productsProxy = createServiceProxy('products');
  return productsProxy(req, res, next);
}));

/**
 * Orders endpoints requiring authentication
 */
v1Router.use('/orders/*', jwtAuth, asyncHandler(async (req, res, next) => {
  // Forward to orders service
  const ordersProxy = createServiceProxy('orders');
  return ordersProxy(req, res, next);
}));

/**
 * Payment endpoints requiring authentication and special permissions
 */
v1Router.use('/payments/*', 
  jwtAuth, 
  requirePermissions(['payment:process']),
  createCustomRateLimit(10, 15 * 60 * 1000, 'payment'), // 10 requests per 15 minutes
  asyncHandler(async (req, res, next) => {
    // Forward to payments service
    const paymentsProxy = createServiceProxy('payments');
    return paymentsProxy(req, res, next);
  })
);

/**
 * Analytics endpoints requiring specific role
 */
v1Router.use('/analytics/*', 
  jwtAuth, 
  requireRoles(['admin', 'analyst']),
  asyncHandler(async (req, res, next) => {
    // Forward to analytics service
    const analyticsProxy = createServiceProxy('analytics');
    return analyticsProxy(req, res, next);
  })
);

/**
 * File upload endpoints with special rate limiting
 */
v1Router.use('/files/*', 
  jwtAuth,
  createCustomRateLimit(20, 15 * 60 * 1000, 'files'), // 20 requests per 15 minutes
  asyncHandler(async (req, res, next) => {
    // Forward to file service
    const filesProxy = createServiceProxy('files');
    return filesProxy(req, res, next);
  })
);

/**
 * Notifications endpoints
 */
v1Router.use('/notifications/*', jwtAuth, asyncHandler(async (req, res, next) => {
  // Forward to notifications service
  const notificationsProxy = createServiceProxy('notifications');
  return notificationsProxy(req, res, next);
}));

/**
 * Search endpoints with higher rate limit
 */
v1Router.use('/search/*', 
  optionalJwtAuth,
  createCustomRateLimit(200, 15 * 60 * 1000, 'search'), // 200 requests per 15 minutes
  asyncHandler(async (req, res, next) => {
    // Forward to search service
    const searchProxy = createServiceProxy('search');
    return searchProxy(req, res, next);
  })
);

/**
 * Dynamic service proxy for any registered service
 * This is a catch-all for services not explicitly defined above
 */
v1Router.use('/*', jwtAuth, asyncHandler(async (req, res, next) => {
  logger.info(`Dynamic proxy request: ${req.method} ${req.path}`);
  return dynamicServiceProxy(req, res, next);
}));

/**
 * Service registry endpoint for development/debugging
 */
v1Router.get('/registry', 
  jwtAuth, 
  requireRoles(['admin', 'developer']),
  (req, res) => {
    const registeredServices = getRegisteredServices();
    res.json({
      services: registeredServices,
      total: registeredServices.length,
      timestamp: new Date().toISOString(),
    });
  }
);

// Mount v1 routes
router.use('/v1', v1Router);

/**
 * Default version redirect
 */
router.use('/*', (req, res, next) => {
  // Redirect to v1 by default
  const originalUrl = req.originalUrl.replace('/api', '/api/v1');
  res.redirect(301, originalUrl);
});

export default router;