/**
 * API Routes Index
 *
 * Main router that combines all API routes
 * @author {{author}}
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
// const userRoutes = require('./users');

// API information endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to {{projectName}} API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth'
      // users: '/api/users'
    }
  });
});

// Register route modules
router.use('/auth', authRoutes);
// router.use('/users', userRoutes);

module.exports = router;
