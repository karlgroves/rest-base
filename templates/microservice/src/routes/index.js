/**
 * API Routes Index
 *
 * Main router for the microservice API
 * @author {{author}}
 */

const express = require('express');
const router = express.Router();

// Import route modules
const itemsRoutes = require('./items');
// Add more route modules as needed

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     description: Returns basic information about the API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to {{projectName}} microservice API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      items: '/api/items'
      // Add more endpoints as needed
    },
    timestamp: new Date().toISOString()
  });
});

// Register route modules
router.use('/items', itemsRoutes);
// Add more routes as needed

module.exports = router;