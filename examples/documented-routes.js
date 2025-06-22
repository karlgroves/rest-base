/**
 * Example Routes with API Documentation
 * 
 * This file demonstrates how to document Express routes
 * for automatic API documentation generation
 */

const express = require('express');
const router = express.Router();

// Middleware imports (example)
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { userSchema, updateUserSchema } = require('../schemas/user');

/**
 * @route GET /api/users
 * @summary Get all users
 * @description Retrieves a paginated list of all users in the system with optional filtering
 * @tag Users
 * @tag Admin
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of items per page (max 100)
 * @param {string} [sort=createdAt] - Sort field (createdAt, updatedAt, email, name)
 * @param {string} [order=desc] - Sort order (asc or desc)
 * @param {string} [search] - Search term for email or name
 * @param {string} [role] - Filter by user role (user, admin, moderator)
 * @param {boolean} [active] - Filter by active status
 * @response 200 - Successful response with user list and pagination info
 * @response 400 - Invalid query parameters
 * @response 401 - Missing or invalid authentication token
 * @response 403 - Insufficient permissions
 * @security bearerAuth
 */
router.get('/users', 
  authenticate, 
  authorize('admin'), 
  async (req, res, next) => {
    try {
      // Implementation would go here
      res.json({
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/users
 * @summary Create a new user
 * @description Creates a new user account with the provided information. Requires admin privileges.
 * @tag Users
 * @tag Admin
 * @param {string} email - User email address (must be unique)
 * @param {string} password - User password (min 8 chars, must include number and special char)
 * @param {string} name - User full name
 * @param {string} [role=user] - User role (user, admin, moderator)
 * @param {boolean} [active=true] - Whether the user account is active
 * @param {object} [profile] - Additional profile information
 * @param {string} [profile.phone] - Phone number
 * @param {string} [profile.avatar] - Avatar URL
 * @response 201 - User created successfully
 * @response 400 - Validation error or missing required fields
 * @response 401 - Unauthorized
 * @response 403 - Insufficient permissions
 * @response 409 - Email already exists
 * @security bearerAuth
 */
router.post('/users',
  authenticate,
  authorize('admin'),
  validate(userSchema),
  async (req, res, next) => {
    try {
      // Implementation would go here
      res.status(201).json({
        user: {
          id: '123',
          email: req.body.email,
          name: req.body.name,
          role: req.body.role || 'user',
          active: req.body.active !== false,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/users/:id
 * @summary Get user by ID
 * @description Retrieves detailed information about a specific user
 * @tag Users
 * @param {string} id - User ID (UUID format)
 * @response 200 - User found
 * @response 401 - Unauthorized
 * @response 403 - Insufficient permissions (can only view own profile unless admin)
 * @response 404 - User not found
 * @security bearerAuth
 */
router.get('/users/:id',
  authenticate,
  async (req, res, next) => {
    try {
      // Check if user can access this profile
      const canAccess = req.user.id === req.params.id || req.user.role === 'admin';
      
      if (!canAccess) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Implementation would go here
      res.json({
        user: {
          id: req.params.id,
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user',
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/users/:id
 * @summary Update user
 * @description Updates user information. Users can update their own profile, admins can update anyone.
 * @tag Users
 * @param {string} id - User ID
 * @param {string} [email] - New email address
 * @param {string} [name] - New name
 * @param {string} [password] - New password
 * @param {string} [role] - New role (admin only)
 * @param {boolean} [active] - Active status (admin only)
 * @response 200 - User updated successfully
 * @response 400 - Validation error
 * @response 401 - Unauthorized
 * @response 403 - Insufficient permissions
 * @response 404 - User not found
 * @response 409 - Email already in use
 * @security bearerAuth
 */
router.put('/users/:id',
  authenticate,
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      // Check permissions
      const isOwnProfile = req.user.id === req.params.id;
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Prevent non-admins from changing role/active status
      if (!isAdmin && (req.body.role || req.body.active !== undefined)) {
        return res.status(403).json({ 
          error: 'Only admins can change role or active status' 
        });
      }

      // Implementation would go here
      res.json({
        user: {
          id: req.params.id,
          ...req.body,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/users/:id
 * @summary Delete user
 * @description Permanently deletes a user account. This action cannot be undone.
 * @tag Users
 * @tag Admin
 * @param {string} id - User ID
 * @response 204 - User deleted successfully
 * @response 401 - Unauthorized
 * @response 403 - Insufficient permissions (admin only)
 * @response 404 - User not found
 * @security bearerAuth
 */
router.delete('/users/:id',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      // Prevent self-deletion
      if (req.user.id === req.params.id) {
        return res.status(400).json({ 
          error: 'Cannot delete your own account' 
        });
      }

      // Implementation would go here
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/users/:id/reset-password
 * @summary Reset user password
 * @description Sends a password reset email to the user
 * @tag Users
 * @tag Authentication
 * @param {string} id - User ID
 * @response 200 - Password reset email sent
 * @response 401 - Unauthorized
 * @response 403 - Insufficient permissions
 * @response 404 - User not found
 * @response 429 - Too many requests (rate limited)
 * @security bearerAuth
 */
router.post('/users/:id/reset-password',
  authenticate,
  async (req, res, next) => {
    try {
      // Check permissions
      const canReset = req.user.id === req.params.id || req.user.role === 'admin';
      
      if (!canReset) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Implementation would go here
      res.json({
        message: 'Password reset email sent',
        expiresIn: '1 hour'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/users/:id/sessions
 * @summary Get user sessions
 * @description Retrieves all active sessions for a user
 * @tag Users
 * @tag Security
 * @param {string} id - User ID
 * @response 200 - List of active sessions
 * @response 401 - Unauthorized
 * @response 403 - Can only view own sessions unless admin
 * @response 404 - User not found
 * @security bearerAuth
 */
router.get('/users/:id/sessions',
  authenticate,
  async (req, res, next) => {
    try {
      // Check permissions
      const canView = req.user.id === req.params.id || req.user.role === 'admin';
      
      if (!canView) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Implementation would go here
      res.json({
        sessions: [
          {
            id: 'session-1',
            deviceInfo: 'Chrome on Windows',
            ipAddress: '192.168.1.1',
            lastActive: new Date().toISOString(),
            current: true
          }
        ]
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Health check endpoint (no authentication required)
 * @route GET /api/health
 * @summary Health check
 * @description Simple health check endpoint for monitoring
 * @tag System
 * @response 200 - Service is healthy
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;