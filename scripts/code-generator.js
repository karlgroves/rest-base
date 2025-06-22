#!/usr/bin/env node

/**
 * Code Generator for Common Patterns
 * 
 * Generates boilerplate code for common Node.js/Express patterns
 * following REST-SPEC conventions and best practices
 * 
 * @author REST-SPEC
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Simple color functions for output
const color = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Simple spinner implementation
const createSpinner = (text) => {
  let interval;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const spinner = {
    start() {
      process.stdout.write(`\r${frames[i]} ${text}`);
      interval = setInterval(() => {
        process.stdout.write(`\r${frames[i]} ${spinner.text || text}`);
        i = (i + 1) % frames.length;
      }, 80);
      return spinner;
    },
    succeed(msg) {
      clearInterval(interval);
      process.stdout.write(`\r✓ ${msg}\n`);
    },
    fail(msg) {
      clearInterval(interval);
      process.stdout.write(`\r✗ ${msg}\n`);
    },
    text: text
  };
  
  return spinner;
};

/**
 * Template Engine - Simple mustache-style replacement
 */
function renderTemplate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * Convert string to different cases
 */
const caseConverter = {
  camelCase: (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
  pascalCase: (str) => caseConverter.camelCase(str).replace(/^[a-z]/, c => c.toUpperCase()),
  kebabCase: (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, ''),
  snakeCase: (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
  constantCase: (str) => caseConverter.snakeCase(str).toUpperCase(),
  pluralize: (str) => str.endsWith('s') ? str : str + 's'
};

/**
 * Route Generator Templates
 */
const routeTemplates = {
  crud: `/**
 * {{entityName}} Routes
 * 
 * CRUD operations for {{entityName}} resource
 * @author {{author}}
 */

const express = require('express');
const router = express.Router();
const {{entityCamelCase}}Controller = require('../controllers/{{entityKebabCase}}Controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { {{entityCamelCase}}Schema, update{{entityPascalCase}}Schema } = require('../schemas/{{entityKebabCase}}');

/**
 * @route GET /api/{{entityPlural}}
 * @summary Get all {{entityPlural}}
 * @description Retrieves a paginated list of {{entityPlural}}
 * @tag {{entityPascalCase}}
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @param {string} [sort=createdAt] - Sort field
 * @param {string} [order=desc] - Sort order
 * @response 200 - List of {{entityPlural}}
 * @response 400 - Invalid query parameters
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/', 
  authenticate,
  {{entityCamelCase}}Controller.getAll
);

/**
 * @route GET /api/{{entityPlural}}/:id
 * @summary Get {{entityName}} by ID
 * @description Retrieves a specific {{entityName}} by ID
 * @tag {{entityPascalCase}}
 * @param {string} id - {{entityName}} ID
 * @response 200 - {{entityName}} found
 * @response 404 - {{entityName}} not found
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/:id',
  authenticate,
  {{entityCamelCase}}Controller.getById
);

/**
 * @route POST /api/{{entityPlural}}
 * @summary Create new {{entityName}}
 * @description Creates a new {{entityName}}
 * @tag {{entityPascalCase}}
 * @param {object} {{entityCamelCase}} - {{entityName}} data
 * @response 201 - {{entityName}} created
 * @response 400 - Validation error
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.post('/',
  authenticate,
  validate({{entityCamelCase}}Schema),
  {{entityCamelCase}}Controller.create
);

/**
 * @route PUT /api/{{entityPlural}}/:id
 * @summary Update {{entityName}}
 * @description Updates an existing {{entityName}}
 * @tag {{entityPascalCase}}
 * @param {string} id - {{entityName}} ID
 * @param {object} {{entityCamelCase}} - Updated {{entityName}} data
 * @response 200 - {{entityName}} updated
 * @response 400 - Validation error
 * @response 404 - {{entityName}} not found
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.put('/:id',
  authenticate,
  validate(update{{entityPascalCase}}Schema),
  {{entityCamelCase}}Controller.update
);

/**
 * @route DELETE /api/{{entityPlural}}/:id
 * @summary Delete {{entityName}}
 * @description Deletes a {{entityName}}
 * @tag {{entityPascalCase}}
 * @param {string} id - {{entityName}} ID
 * @response 204 - {{entityName}} deleted
 * @response 404 - {{entityName}} not found
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.delete('/:id',
  authenticate,
  {{entityCamelCase}}Controller.delete
);

module.exports = router;`,

  auth: `/**
 * Authentication Routes
 * 
 * Authentication and authorization endpoints
 * @author {{author}}
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema, resetPasswordSchema } = require('../schemas/auth');

/**
 * @route POST /api/auth/register
 * @summary Register new user
 * @description Creates a new user account
 * @tag Authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @response 201 - User registered successfully
 * @response 400 - Validation error
 * @response 409 - Email already exists
 */
router.post('/register',
  validate(registerSchema),
  authController.register
);

/**
 * @route POST /api/auth/login
 * @summary User login
 * @description Authenticates user and returns JWT token
 * @tag Authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @response 200 - Login successful
 * @response 400 - Invalid credentials
 * @response 401 - Authentication failed
 */
router.post('/login',
  validate(loginSchema),
  authController.login
);

/**
 * @route POST /api/auth/logout
 * @summary User logout
 * @description Invalidates the current session
 * @tag Authentication
 * @response 200 - Logout successful
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route POST /api/auth/refresh
 * @summary Refresh token
 * @description Refreshes JWT token
 * @tag Authentication
 * @response 200 - Token refreshed
 * @response 401 - Invalid refresh token
 * @security bearerAuth
 */
router.post('/refresh',
  authenticate,
  authController.refresh
);

/**
 * @route POST /api/auth/reset-password
 * @summary Reset password
 * @description Sends password reset email
 * @tag Authentication
 * @param {string} email - User email
 * @response 200 - Reset email sent
 * @response 400 - Invalid email
 * @response 404 - User not found
 */
router.post('/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route GET /api/auth/me
 * @summary Get current user
 * @description Returns current user profile
 * @tag Authentication
 * @response 200 - User profile
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/me',
  authenticate,
  authController.getProfile
);

module.exports = router;`
};

/**
 * Controller Generator Templates
 */
const controllerTemplates = {
  crud: `/**
 * {{entityName}} Controller
 * 
 * Controller for {{entityName}} CRUD operations
 * @author {{author}}
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const {{entityPascalCase}} = require('../models/{{entityPascalCase}}');

/**
 * Get all {{entityPlural}}
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { rows: {{entityPlural}}, count } = await {{entityPascalCase}}.findAndCountAll({
      limit: limitNum,
      offset,
      order: [[sort, order.toUpperCase()]],
      where: buildWhereClause(req.query)
    });

    const totalPages = Math.ceil(count / limitNum);

    logger.info({
      component: '{{entityKebabCase}}-controller',
      action: 'getAll',
      userId: req.user?.id,
      count,
      page: pageNum,
      limit: limitNum
    }, 'Retrieved {{entityPlural}}');

    res.json({
      {{entityPlural}},
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error({
      component: '{{entityKebabCase}}-controller',
      action: 'getAll',
      userId: req.user?.id,
      err: error
    }, 'Failed to retrieve {{entityPlural}}');
    
    next(error);
  }
};

/**
 * Get {{entityName}} by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const {{entityCamelCase}} = await {{entityPascalCase}}.findByPk(id);
    
    if (!{{entityCamelCase}}) {
      throw new AppError('{{entityName}} not found', 404);
    }

    logger.info({
      component: '{{entityKebabCase}}-controller',
      action: 'getById',
      userId: req.user?.id,
      {{entityCamelCase}}Id: id
    }, '{{entityName}} retrieved');

    res.json({{ "{{entityCamelCase}}" }});
  } catch (error) {
    logger.error({
      component: '{{entityKebabCase}}-controller',
      action: 'getById',
      userId: req.user?.id,
      {{entityCamelCase}}Id: req.params.id,
      err: error
    }, 'Failed to retrieve {{entityName}}');
    
    next(error);
  }
};

/**
 * Create new {{entityName}}
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const create = async (req, res, next) => {
  try {
    const {{entityCamelCase}}Data = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const {{entityCamelCase}} = await {{entityPascalCase}}.create({{entityCamelCase}}Data);

    logger.info({
      component: '{{entityKebabCase}}-controller',
      action: 'create',
      userId: req.user.id,
      {{entityCamelCase}}Id: {{entityCamelCase}}.id
    }, '{{entityName}} created');

    res.status(201).json({{ "{{entityCamelCase}}" }});
  } catch (error) {
    logger.error({
      component: '{{entityKebabCase}}-controller',
      action: 'create',
      userId: req.user?.id,
      err: error
    }, 'Failed to create {{entityName}}');
    
    next(error);
  }
};

/**
 * Update {{entityName}}
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const {{entityCamelCase}} = await {{entityPascalCase}}.findByPk(id);
    
    if (!{{entityCamelCase}}) {
      throw new AppError('{{entityName}} not found', 404);
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    await {{entityCamelCase}}.update(updateData);
    await {{entityCamelCase}}.reload();

    logger.info({
      component: '{{entityKebabCase}}-controller',
      action: 'update',
      userId: req.user.id,
      {{entityCamelCase}}Id: id
    }, '{{entityName}} updated');

    res.json({{ "{{entityCamelCase}}" }});
  } catch (error) {
    logger.error({
      component: '{{entityKebabCase}}-controller',
      action: 'update',
      userId: req.user?.id,
      {{entityCamelCase}}Id: req.params.id,
      err: error
    }, 'Failed to update {{entityName}}');
    
    next(error);
  }
};

/**
 * Delete {{entityName}}
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteFn = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const {{entityCamelCase}} = await {{entityPascalCase}}.findByPk(id);
    
    if (!{{entityCamelCase}}) {
      throw new AppError('{{entityName}} not found', 404);
    }

    await {{entityCamelCase}}.destroy();

    logger.info({
      component: '{{entityKebabCase}}-controller',
      action: 'delete',
      userId: req.user.id,
      {{entityCamelCase}}Id: id
    }, '{{entityName}} deleted');

    res.status(204).send();
  } catch (error) {
    logger.error({
      component: '{{entityKebabCase}}-controller',
      action: 'delete',
      userId: req.user?.id,
      {{entityCamelCase}}Id: req.params.id,
      err: error
    }, 'Failed to delete {{entityName}}');
    
    next(error);
  }
};

/**
 * Build where clause for filtering
 * @param {Object} query - Query parameters
 * @returns {Object} Sequelize where clause
 */
const buildWhereClause = (query) => {
  const where = {};
  
  // Add common filters here
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: \`%\${query.search}%\` } },
      { description: { [Op.iLike]: \`%\${query.search}%\` } }
    ];
  }
  
  if (query.status) {
    where.status = query.status;
  }
  
  if (query.createdBy) {
    where.createdBy = query.createdBy;
  }
  
  return where;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteFn
};`,

  auth: `/**
 * Authentication Controller
 * 
 * Handles user authentication and authorization
 * @author {{author}}
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generate JWT tokens
 * @param {Object} user - User object
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  return { accessToken, refreshToken };
};

/**
 * Register new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
      isActive: true
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info({
      component: 'auth-controller',
      action: 'register',
      userId: user.id,
      email: user.email
    }, 'User registered successfully');

    res.status(201).json({
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error({
      component: 'auth-controller',
      action: 'register',
      email: req.body?.email,
      err: error
    }, 'User registration failed');
    
    next(error);
  }
};

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is disabled', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info({
      component: 'auth-controller',
      action: 'login',
      userId: user.id,
      email: user.email
    }, 'User logged in successfully');

    res.json({
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error({
      component: 'auth-controller',
      action: 'login',
      email: req.body?.email,
      err: error
    }, 'User login failed');
    
    next(error);
  }
};

/**
 * User logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logout = async (req, res, next) => {
  try {
    // In a real application, you might want to blacklist the token
    // or store it in a database/cache for checking

    logger.info({
      component: 'auth-controller',
      action: 'logout',
      userId: req.user.id
    }, 'User logged out');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({
      component: 'auth-controller',
      action: 'logout',
      userId: req.user?.id,
      err: error
    }, 'Logout failed');
    
    next(error);
  }
};

/**
 * Refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const refresh = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info({
      component: 'auth-controller',
      action: 'refresh',
      userId: user.id
    }, 'Token refreshed');

    res.json({
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error({
      component: 'auth-controller',
      action: 'refresh',
      userId: req.user?.id,
      err: error
    }, 'Token refresh failed');
    
    next(error);
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token and expiry
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
    });

    // Send reset email
    const resetUrl = \`\${process.env.FRONTEND_URL}/reset-password?token=\${resetToken}\`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        name: user.name,
        resetUrl,
        expiresIn: '1 hour'
      }
    });

    logger.info({
      component: 'auth-controller',
      action: 'resetPassword',
      email: user.email
    }, 'Password reset email sent');

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    logger.error({
      component: 'auth-controller',
      action: 'resetPassword',
      email: req.body?.email,
      err: error
    }, 'Password reset failed');
    
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken'] }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    logger.error({
      component: 'auth-controller',
      action: 'getProfile',
      userId: req.user?.id,
      err: error
    }, 'Get profile failed');
    
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  resetPassword,
  getProfile
};`
};

/**
 * Model Generator Templates
 */
const modelTemplates = {
  sequelize: `/**
 * {{entityName}} Model
 * 
 * Sequelize model for {{entityName}} entity
 * @author {{author}}
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const {{entityPascalCase}} = sequelize.define('{{entityPascalCase}}', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active',
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: '{{entitySnakeCase}}',
  timestamps: true,
  paranoid: true, // Soft deletes
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeCreate: ({{entityCamelCase}}, options) => {
      // Add any pre-creation logic here
      if (!{{entityCamelCase}}.id) {
        {{entityCamelCase}}.id = DataTypes.UUIDV4();
      }
    },
    beforeUpdate: ({{entityCamelCase}}, options) => {
      // Add any pre-update logic here
      {{entityCamelCase}}.updatedAt = new Date();
    }
  }
});

// Class methods
{{entityPascalCase}}.associate = (models) => {
  // Define associations here
  {{entityPascalCase}}.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  {{entityPascalCase}}.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });
};

// Instance methods
{{entityPascalCase}}.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Remove sensitive fields if needed
  // delete values.password;
  
  return values;
};

{{entityPascalCase}}.prototype.isOwnedBy = function(userId) {
  return this.createdBy === userId;
};

{{entityPascalCase}}.prototype.canBeEditedBy = function(user) {
  return user.role === 'admin' || this.createdBy === user.id;
};

// Static methods
{{entityPascalCase}}.findActive = function() {
  return this.findAll({
    where: { status: 'active' }
  });
};

{{entityPascalCase}}.findByUser = function(userId) {
  return this.findAll({
    where: { createdBy: userId }
  });
};

{{entityPascalCase}}.searchByName = function(searchTerm) {
  return this.findAll({
    where: {
      name: {
        [Op.iLike]: \`%\${searchTerm}%\`
      }
    }
  });
};

module.exports = {{entityPascalCase}};`
};

/**
 * Middleware Generator Templates
 */
const middlewareTemplates = {
  validation: `/**
 * {{entityName}} Validation Middleware
 * 
 * Input validation schemas for {{entityName}} operations
 * @author {{author}}
 */

const Joi = require('joi');

/**
 * Common validation rules
 */
const commonRules = {
  id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('active', 'inactive', 'pending').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('name', 'createdAt', 'updatedAt', 'status').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
};

/**
 * Schema for creating {{entityName}}
 */
const create{{entityPascalCase}}Schema = Joi.object({
  name: commonRules.name,
  description: commonRules.description,
  status: commonRules.status.default('active'),
  metadata: Joi.object().optional()
});

/**
 * Schema for updating {{entityName}}
 */
const update{{entityPascalCase}}Schema = Joi.object({
  name: commonRules.name.optional(),
  description: commonRules.description,
  status: commonRules.status,
  metadata: Joi.object().optional()
}).min(1); // At least one field must be provided

/**
 * Schema for {{entityName}} query parameters
 */
const {{entityCamelCase}}QuerySchema = Joi.object({
  page: commonRules.page,
  limit: commonRules.limit,
  sort: commonRules.sort,
  order: commonRules.order,
  search: Joi.string().max(255).optional(),
  status: Joi.string().valid('active', 'inactive', 'pending').optional(),
  createdBy: Joi.string().uuid().optional()
});

/**
 * Schema for {{entityName}} ID parameter
 */
const {{entityCamelCase}}IdSchema = Joi.object({
  id: commonRules.id
});

/**
 * Validation middleware factory
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
    }

    // Replace req[target] with validated and sanitized data
    req[target] = value;
    next();
  };
};

module.exports = {
  create{{entityPascalCase}}Schema,
  update{{entityPascalCase}}Schema,
  {{entityCamelCase}}QuerySchema,
  {{entityCamelCase}}IdSchema,
  validate
};`,

  auth: `/**
 * Authentication Middleware
 * 
 * JWT authentication and authorization middleware
 * @author {{author}}
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is disabled', 401);
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn({
        component: 'auth-middleware',
        action: 'authenticate',
        error: 'Invalid token'
      }, 'Authentication failed: Invalid token');
      
      return next(new AppError('Invalid authentication token', 401));
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn({
        component: 'auth-middleware',
        action: 'authenticate',
        error: 'Token expired'
      }, 'Authentication failed: Token expired');
      
      return next(new AppError('Authentication token expired', 401));
    }

    logger.error({
      component: 'auth-middleware',
      action: 'authenticate',
      err: error
    }, 'Authentication failed');

    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    // If token is provided, validate it
    await authenticate(req, res, next);
  } catch (error) {
    // If token is invalid, continue without user but log the attempt
    logger.warn({
      component: 'auth-middleware',
      action: 'optionalAuth',
      err: error
    }, 'Optional authentication failed');
    
    next();
  }
};

/**
 * Authorize user roles
 * @param {...string} roles - Required roles
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        component: 'auth-middleware',
        action: 'authorize',
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles
      }, 'Authorization failed: Insufficient permissions');
      
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Check if user owns resource or has admin role
 * @param {string} resourceIdField - Field name containing resource ID
 * @param {string} ownerField - Field name containing owner ID
 * @returns {Function} Express middleware function
 */
const authorizeOwnerOrAdmin = (resourceIdField = 'id', ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Admin can access anything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdField];
      if (!resourceId) {
        return next(new AppError('Resource ID required', 400));
      }

      // This is a generic approach - in practice, you'd check against specific models
      // You might want to create model-specific versions of this middleware
      
      next();
    } catch (error) {
      logger.error({
        component: 'auth-middleware',
        action: 'authorizeOwnerOrAdmin',
        userId: req.user?.id,
        err: error
      }, 'Authorization check failed');
      
      next(error);
    }
  };
};

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }

    // Check current user's requests
    const userRequests = requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      logger.warn({
        component: 'auth-middleware',
        action: 'rateLimit',
        identifier,
        requestCount: validRequests.length,
        maxRequests
      }, 'Rate limit exceeded');

      return res.status(429).json({
        error: 'Too many requests',
        message: \`Rate limit exceeded. Maximum \${maxRequests} requests per \${Math.floor(windowMs / 1000)} seconds.\`,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000),
        timestamp: new Date().toISOString()
      });
    }

    // Add current request
    validRequests.push(now);
    requests.set(identifier, validRequests);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - validRequests.length),
      'X-RateLimit-Reset': new Date(windowStart + windowMs).toISOString()
    });

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  authorizeOwnerOrAdmin,
  rateLimit
};`
};

/**
 * Test Generator Templates
 */
const testTemplates = {
  controller: `/**
 * {{entityName}} Controller Tests
 * 
 * Unit tests for {{entityName}} controller
 * @author {{author}}
 */

const request = require('supertest');
const app = require('../src/app');
const { {{entityPascalCase}} } = require('../src/models');
const { generateToken } = require('../src/middleware/auth');

describe('{{entityName}} Controller', () => {
  let authToken;
  let testUser;
  let test{{entityPascalCase}};

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'user'
    });

    authToken = generateToken(testUser);
  });

  beforeEach(async () => {
    // Create test {{entityName}}
    test{{entityPascalCase}} = await {{entityPascalCase}}.create({
      name: 'Test {{entityName}}',
      description: 'Test description',
      status: 'active',
      createdBy: testUser.id
    });
  });

  afterEach(async () => {
    // Clean up test data
    await {{entityPascalCase}}.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    // Clean up test user
    await User.destroy({ where: { id: testUser.id }, force: true });
  });

  describe('GET /api/{{entityPlural}}', () => {
    test('should return list of {{entityPlural}}', async () => {
      const response = await request(app)
        .get('/api/{{entityPlural}}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).toHaveProperty('{{entityPlural}}');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.{{entityPlural}})).toBe(true);
      expect(response.body.{{entityPlural}}).toHaveLength(1);
      expect(response.body.{{entityPlural}}[0]).toMatchObject({
        id: test{{entityPascalCase}}.id,
        name: 'Test {{entityName}}',
        status: 'active'
      });
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/{{entityPlural}}')
        .expect(401);
    });

    test('should support pagination', async () => {
      // Create additional test items
      await {{entityPascalCase}}.bulkCreate([
        { name: '{{entityName}} 2', createdBy: testUser.id },
        { name: '{{entityName}} 3', createdBy: testUser.id }
      ]);

      const response = await request(app)
        .get('/api/{{entityPlural}}?page=1&limit=2')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body.{{entityPlural}}).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
    });

    test('should support sorting', async () => {
      await {{entityPascalCase}}.create({
        name: 'Alpha {{entityName}}',
        createdBy: testUser.id
      });

      const response = await request(app)
        .get('/api/{{entityPlural}}?sort=name&order=asc')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body.{{entityPlural}}[0].name).toBe('Alpha {{entityName}}');
    });
  });

  describe('GET /api/{{entityPlural}}/:id', () => {
    test('should return specific {{entityName}}', async () => {
      const response = await request(app)
        .get(\`/api/{{entityPlural}}/\${test{{entityPascalCase}}.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body.{{entityCamelCase}}).toMatchObject({
        id: test{{entityPascalCase}}.id,
        name: 'Test {{entityName}}',
        description: 'Test description',
        status: 'active'
      });
    });

    test('should return 404 for non-existent {{entityName}}', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .get(\`/api/{{entityPlural}}/\${nonExistentId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(404);
    });

    test('should require authentication', async () => {
      await request(app)
        .get(\`/api/{{entityPlural}}/\${test{{entityPascalCase}}.id}\`)
        .expect(401);
    });
  });

  describe('POST /api/{{entityPlural}}', () => {
    test('should create new {{entityName}}', async () => {
      const {{entityCamelCase}}Data = {
        name: 'New {{entityName}}',
        description: 'New description',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/{{entityPlural}}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({{entityCamelCase}}Data)
        .expect(201);

      expect(response.body.{{entityCamelCase}}).toMatchObject({{entityCamelCase}}Data);
      expect(response.body.{{entityCamelCase}}).toHaveProperty('id');
      expect(response.body.{{entityCamelCase}}.createdBy).toBe(testUser.id);

      // Verify it was saved to database
      const saved{{entityPascalCase}} = await {{entityPascalCase}}.findByPk(response.body.{{entityCamelCase}}.id);
      expect(saved{{entityPascalCase}}).toBeTruthy();
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/{{entityPlural}}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    test('should require authentication', async () => {
      await request(app)
        .post('/api/{{entityPlural}}')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('PUT /api/{{entityPlural}}/:id', () => {
    test('should update existing {{entityName}}', async () => {
      const updateData = {
        name: 'Updated {{entityName}}',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(\`/api/{{entityPlural}}/\${test{{entityPascalCase}}.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(updateData)
        .expect(200);

      expect(response.body.{{entityCamelCase}}).toMatchObject(updateData);

      // Verify it was updated in database
      await test{{entityPascalCase}}.reload();
      expect(test{{entityPascalCase}}.name).toBe('Updated {{entityName}}');
    });

    test('should return 404 for non-existent {{entityName}}', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .put(\`/api/{{entityPlural}}/\${nonExistentId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    test('should validate update data', async () => {
      const response = await request(app)
        .put(\`/api/{{entityPlural}}/\${test{{entityPascalCase}}.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({ name: '' }) // Empty name should fail validation
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/{{entityPlural}}/:id', () => {
    test('should delete existing {{entityName}}', async () => {
      await request(app)
        .delete(\`/api/{{entityPlural}}/\${test{{entityPascalCase}}.id}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(204);

      // Verify it was deleted from database
      const deleted{{entityPascalCase}} = await {{entityPascalCase}}.findByPk(test{{entityPascalCase}}.id);
      expect(deleted{{entityPascalCase}}).toBeNull();
    });

    test('should return 404 for non-existent {{entityName}}', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .delete(\`/api/{{entityPlural}}/\${nonExistentId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(404);
    });

    test('should require authentication', async () => {
      await request(app)
        .delete(\`/api/{{entityPlural}}/\${test{{entityPascalCase}}.id}\`)
        .expect(401);
    });
  });
});`
};

/**
 * Generate code based on template and options
 */
async function generateCode(type, template, entityName, options = {}) {
  const spinner = createSpinner(`Generating ${type}...`).start();
  
  try {
    // Generate all case variations
    const variables = {
      entityName,
      entityCamelCase: caseConverter.camelCase(entityName),
      entityPascalCase: caseConverter.pascalCase(entityName),
      entityKebabCase: caseConverter.kebabCase(entityName),
      entitySnakeCase: caseConverter.snakeCase(entityName),
      entityConstantCase: caseConverter.constantCase(entityName),
      entityPlural: caseConverter.pluralize(caseConverter.kebabCase(entityName)),
      author: options.author || process.env.USER || 'Developer',
      ...options
    };

    // Get template content
    let templateContent;
    switch (type) {
      case 'route':
        templateContent = routeTemplates[template] || routeTemplates.crud;
        break;
      case 'controller':
        templateContent = controllerTemplates[template] || controllerTemplates.crud;
        break;
      case 'model':
        templateContent = modelTemplates[template] || modelTemplates.sequelize;
        break;
      case 'middleware':
        templateContent = middlewareTemplates[template] || middlewareTemplates.validation;
        break;
      case 'test':
        templateContent = testTemplates[template] || testTemplates.controller;
        break;
      default:
        throw new Error(`Unknown generator type: ${type}`);
    }

    // Render template
    const renderedContent = renderTemplate(templateContent, variables);

    // Determine output file path
    const outputPath = generateOutputPath(type, template, entityName, options);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write file
    await fs.writeFile(outputPath, renderedContent);

    spinner.succeed(color.green(`${type} generated: ${outputPath}`));
    
    return {
      type,
      template,
      entityName,
      outputPath,
      content: renderedContent
    };
  } catch (error) {
    spinner.fail(color.red(`Failed to generate ${type}: ${error.message}`));
    throw error;
  }
}

/**
 * Generate output file path
 */
function generateOutputPath(type, template, entityName, options) {
  const basePath = options.outputDir || process.cwd();
  const kebabCase = caseConverter.kebabCase(entityName);
  const pascalCase = caseConverter.pascalCase(entityName);
  
  switch (type) {
    case 'route':
      return path.join(basePath, 'src', 'routes', `${kebabCase}.js`);
    case 'controller':
      return path.join(basePath, 'src', 'controllers', `${kebabCase}Controller.js`);
    case 'model':
      return path.join(basePath, 'src', 'models', `${pascalCase}.js`);
    case 'middleware':
      if (template === 'validation') {
        return path.join(basePath, 'src', 'schemas', `${kebabCase}.js`);
      }
      return path.join(basePath, 'src', 'middleware', `${kebabCase}.js`);
    case 'test':
      return path.join(basePath, 'tests', 'controllers', `${kebabCase}.test.js`);
    default:
      return path.join(basePath, `${kebabCase}.js`);
  }
}

/**
 * Generate complete CRUD setup
 */
async function generateCRUD(entityName, options = {}) {
  const spinner = createSpinner(`Generating complete CRUD for ${entityName}...`).start();
  
  try {
    const results = [];
    
    // Generate in order: model, controller, routes, validation, tests
    const generators = [
      { type: 'model', template: 'sequelize' },
      { type: 'controller', template: 'crud' },
      { type: 'route', template: 'crud' },
      { type: 'middleware', template: 'validation' },
      { type: 'test', template: 'controller' }
    ];

    for (const gen of generators) {
      const result = await generateCode(gen.type, gen.template, entityName, options);
      results.push(result);
    }

    spinner.succeed(color.green(`Complete CRUD generated for ${entityName}`));
    
    // Summary
    console.log('\n' + color.bold('Generated Files:'));
    console.log(color.gray('─'.repeat(50)));
    results.forEach(result => {
      console.log(`${color.cyan(result.type.padEnd(12))} ${result.outputPath}`);
    });
    
    return results;
  } catch (error) {
    spinner.fail(color.red(`Failed to generate CRUD: ${error.message}`));
    throw error;
  }
}

/**
 * Main CLI function
 */
async function main() {
  program
    .name('code-generator')
    .description('Generate boilerplate code for common patterns')
    .version('1.0.0');

  program
    .command('route <entity>')
    .description('Generate route file')
    .option('-t, --template <template>', 'Template type (crud, auth)', 'crud')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('-a, --author <author>', 'Author name')
    .action(async (entity, options) => {
      await generateCode('route', options.template, entity, options);
    });

  program
    .command('controller <entity>')
    .description('Generate controller file')
    .option('-t, --template <template>', 'Template type (crud, auth)', 'crud')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('-a, --author <author>', 'Author name')
    .action(async (entity, options) => {
      await generateCode('controller', options.template, entity, options);
    });

  program
    .command('model <entity>')
    .description('Generate model file')
    .option('-t, --template <template>', 'Template type (sequelize)', 'sequelize')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('-a, --author <author>', 'Author name')
    .action(async (entity, options) => {
      await generateCode('model', options.template, entity, options);
    });

  program
    .command('middleware <entity>')
    .description('Generate middleware file')
    .option('-t, --template <template>', 'Template type (validation, auth)', 'validation')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('-a, --author <author>', 'Author name')
    .action(async (entity, options) => {
      await generateCode('middleware', options.template, entity, options);
    });

  program
    .command('test <entity>')
    .description('Generate test file')
    .option('-t, --template <template>', 'Template type (controller)', 'controller')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('-a, --author <author>', 'Author name')
    .action(async (entity, options) => {
      await generateCode('test', options.template, entity, options);
    });

  program
    .command('crud <entity>')
    .description('Generate complete CRUD setup (model, controller, routes, validation, tests)')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .option('-a, --author <author>', 'Author name')
    .action(async (entity, options) => {
      await generateCRUD(entity, options);
    });

  program
    .command('list')
    .description('List available templates')
    .action(() => {
      console.log(color.bold('Available Templates:'));
      console.log('\n' + color.cyan('Routes:'));
      Object.keys(routeTemplates).forEach(template => {
        console.log(`  - ${template}`);
      });
      console.log('\n' + color.cyan('Controllers:'));
      Object.keys(controllerTemplates).forEach(template => {
        console.log(`  - ${template}`);
      });
      console.log('\n' + color.cyan('Models:'));
      Object.keys(modelTemplates).forEach(template => {
        console.log(`  - ${template}`);
      });
      console.log('\n' + color.cyan('Middleware:'));
      Object.keys(middlewareTemplates).forEach(template => {
        console.log(`  - ${template}`);
      });
      console.log('\n' + color.cyan('Tests:'));
      Object.keys(testTemplates).forEach(template => {
        console.log(`  - ${template}`);
      });
    });

  await program.parseAsync(process.argv);
}

// Export for programmatic use
module.exports = {
  generateCode,
  generateCRUD,
  caseConverter,
  renderTemplate
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(color.red('Error:'), error.message);
    process.exit(1);
  });
}