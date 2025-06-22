/**
 * @fileoverview Main routing configuration for API Gateway
 * @module routes
 * @requires express
 * @requires ./health.js
 * @requires ./proxy.js
 * @requires ./admin.js
 * @requires ../middleware/errorHandler.js
 * @requires ../utils/logger.js
 */

import { Router } from 'express';
import healthRoutes from './health.js';
import proxyRoutes from './proxy.js';
import adminRoutes from './admin.js';
import { notFoundHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * Setup all routes for the API Gateway
 * @param {express.Application} app - Express application instance
 * @returns {void}
 */
export function setupRoutes(app) {
  try {
    // API Gateway root information
    app.get('/', (req, res) => {
      res.json({
        name: '{{projectName}}',
        description: '{{description}}',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: '/api/v1/*',
          admin: '/admin/*',
        },
        documentation: {
          openapi: '/api/docs',
          postman: '/api/postman',
        },
      });
    });

    // Health check routes
    app.use('/health', healthRoutes);

    // Admin routes (protected)
    app.use('/admin', adminRoutes);

    // API proxy routes (main functionality)
    app.use('/api', proxyRoutes);

    // Catch-all for undefined routes
    app.use('*', notFoundHandler);

    logger.info('All routes configured successfully');
  } catch (error) {
    logger.error('Failed to setup routes:', error);
    throw error;
  }
}

export default router;