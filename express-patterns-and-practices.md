# Express.js Patterns and Best Practices

This document outlines proven patterns and best practices for building robust Express.js applications within the UI-Base ecosystem.

## Table of Contents

1. [Application Structure](#application-structure)
2. [Middleware Patterns](#middleware-patterns)
3. [Routing Patterns](#routing-patterns)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Security Patterns](#security-patterns)
6. [Performance Patterns](#performance-patterns)
7. [Testing Patterns](#testing-patterns)
8. [Configuration Patterns](#configuration-patterns)

## Application Structure

### Modular Application Setup

```javascript
// app.js - Main application file
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFoundHandler } = require('./middleware/error-handlers');
const { requestLogger, requestId } = require('./middleware/logging');
const { validateConfig } = require('./config/validation');
const routes = require('./routes');

class Application {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Request ID for tracing
    this.app.use(requestId);
    
    // Security middleware (must be first)
    this.app.use(helmet());
    this.app.use(cors(this.getCorsOptions()));
    this.app.use(this.getRateLimiter());
    
    // Parsing middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging
    this.app.use(requestLogger);
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // API routes
    this.app.use('/api/v1', routes);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  getCorsOptions() {
    return {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400 // 24 hours
    };
  }

  getRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  start(port = process.env.PORT || 3000) {
    return new Promise((resolve, reject) => {
      // Validate configuration before starting
      try {
        validateConfig();
      } catch (error) {
        return reject(new Error(`Configuration validation failed: ${error.message}`));
      }

      const server = this.app.listen(port, (error) => {
        if (error) {
          return reject(error);
        }
        console.log(`Server running on port ${port}`);
        resolve(server);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
          console.log('Process terminated');
        });
      });
    });
  }
}

module.exports = Application;
```

### Controller Pattern

```javascript
// controllers/UserController.js
const { validationResult } = require('express-validator');
const { NotFoundError, ValidationError } = require('../utils/errors');

class UserController {
  constructor(userService) {
    this.userService = userService;
    
    // Bind methods to preserve 'this' context
    this.getUsers = this.getUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
  }

  /**
   * Get paginated list of users
   */
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100), // Cap at 100
        search,
        status
      };

      const result = await this.userService.getUsers(options);
      
      res.json({
        data: result.users,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await this.userService.findById(id);
      
      if (!user) {
        throw new NotFoundError('User');
      }
      
      res.json({
        data: user,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res, next) {
    try {
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array());
      }

      const userData = req.body;
      const user = await this.userService.createUser(userData);
      
      res.status(201).json({
        data: user,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array());
      }

      const { id } = req.params;
      const updates = req.body;
      
      const user = await this.userService.updateUser(id, updates);
      
      if (!user) {
        throw new NotFoundError('User');
      }
      
      res.json({
        data: user,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await this.userService.deleteUser(id);
      
      if (!deleted) {
        throw new NotFoundError('User');
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
```

## Middleware Patterns

### Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');

/**
 * JWT Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles || []
      };
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw jwtError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {});
  } catch (error) {
    // Continue without authentication
  }
  next();
};

module.exports = { authenticate, optionalAuth };
```

### Authorization Middleware

```javascript
// middleware/authorization.js
const { ForbiddenError } = require('../utils/errors');

/**
 * Role-based authorization
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }
      
      const userRoles = req.user.roles || [];
      const hasRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        throw new ForbiddenError(`Required roles: ${roles.join(', ')}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource ownership authorization
 */
const authorizeOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }
      
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;
      
      // Check if user owns the resource or has admin role
      const isOwner = resourceId === userId;
      const isAdmin = req.user.roles.includes('admin');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('Access denied: insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorize, authorizeOwnership };
```

### Validation Middleware

```javascript
// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * User validation rules
 */
const userValidation = {
  create: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must be at least 8 characters with mixed case, number, and special character'),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name must be 2-50 characters, letters only'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name must be 2-50 characters, letters only')
  ],
  
  update: [
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name must be 2-50 characters, letters only'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name must be 2-50 characters, letters only')
  ]
};

/**
 * Common parameter validations
 */
const paramValidation = {
  id: param('id').isUUID().withMessage('Invalid ID format'),
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
};

/**
 * Validation result handler
 */
const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationError = new ValidationError(errors.array());
    return next(validationError);
  }
  next();
};

module.exports = {
  userValidation,
  paramValidation,
  handleValidationResult
};
```

## Routing Patterns

### Modular Router Setup

```javascript
// routes/index.js
const express = require('express');
const userRoutes = require('./users');
const authRoutes = require('./auth');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', authenticate, userRoutes);

// API versioning
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users'
    },
    documentation: '/docs'
  });
});

module.exports = router;
```

### Resource-based Routing

```javascript
// routes/users.js
const express = require('express');
const UserController = require('../controllers/UserController');
const UserService = require('../services/UserService');
const UserRepository = require('../repositories/UserRepository');
const { userValidation, paramValidation, handleValidationResult } = require('../middleware/validation');
const { authorize, authorizeOwnership } = require('../middleware/authorization');

const router = express.Router();

// Dependency injection
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Routes
router.get('/', 
  paramValidation.pagination,
  handleValidationResult,
  authorize('admin', 'user'),
  userController.getUsers
);

router.get('/:id',
  paramValidation.id,
  handleValidationResult,
  authorizeOwnership(),
  userController.getUserById
);

router.post('/',
  userValidation.create,
  handleValidationResult,
  authorize('admin'),
  userController.createUser
);

router.put('/:id',
  paramValidation.id,
  userValidation.update,
  handleValidationResult,
  authorizeOwnership(),
  userController.updateUser
);

router.delete('/:id',
  paramValidation.id,
  handleValidationResult,
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;
```

## Error Handling Patterns

### Custom Error Classes

```javascript
// utils/errors.js
class ApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(details) {
    super('Validation failed', 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends ApiError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends ApiError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};
```

### Error Handler Middleware

```javascript
// middleware/error-handlers.js
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  // Log error details
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    requestId: req.requestId,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle operational errors
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Handle specific error types
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid resource ID',
      code: 'INVALID_ID',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  if (error.code === 11000) { // MongoDB duplicate key
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Handle programming errors
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Production - don't leak error details
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
};

module.exports = { errorHandler, notFoundHandler };
```

## Security Patterns

### Security Headers

```javascript
// config/security.js
const helmet = require('helmet');

const securityConfig = {
  // Helmet configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Disable if using CDNs
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // CORS configuration
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }
};

module.exports = securityConfig;
```

### Rate Limiting Patterns

```javascript
// middleware/rate-limiting.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiting
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiting for authentication endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter };
```

## Performance Patterns

### Caching Middleware

```javascript
// middleware/cache.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

/**
 * Cache middleware for GET requests
 */
const cache = (duration = 300) => { // Default 5 minutes
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        return res.json(data);
      }
      
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json to cache response
      res.json = function(body) {
        // Cache successful responses only
        if (res.statusCode === 200) {
          redis.setex(key, duration, JSON.stringify(body));
        }
        
        // Call original method
        originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      // If cache fails, continue without caching
      next();
    }
  };
};

/**
 * Cache invalidation
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const keys = await redis.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error('Cache invalidation failed:', error);
    }
    next();
  };
};

module.exports = { cache, invalidateCache };
```

### Compression and Optimization

```javascript
// middleware/optimization.js
const compression = require('compression');

const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses if the request includes a cache-control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Use compression filter function
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (1-9, where 9 is best compression but slowest)
  memLevel: 8 // Memory level (1-9, where 9 uses more memory but is faster)
});

module.exports = { compressionMiddleware };
```

## Testing Patterns

### Controller Testing

```javascript
// tests/controllers/UserController.test.js
const request = require('supertest');
const express = require('express');
const UserController = require('../../controllers/UserController');
const { errorHandler } = require('../../middleware/error-handlers');

describe('UserController', () => {
  let app;
  let mockUserService;
  let userController;

  beforeEach(() => {
    mockUserService = {
      getUsers: jest.fn(),
      findById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn()
    };

    userController = new UserController(mockUserService);

    app = express();
    app.use(express.json());
    
    // Add request ID middleware for testing
    app.use((req, res, next) => {
      req.requestId = 'test-request-id';
      next();
    });

    app.get('/users', userController.getUsers);
    app.get('/users/:id', userController.getUserById);
    app.post('/users', userController.createUser);
    app.put('/users/:id', userController.updateUser);
    app.delete('/users/:id', userController.deleteUser);
    
    app.use(errorHandler);
  });

  describe('GET /users', () => {
    it('should return paginated users', async () => {
      const mockResult = {
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com' }
        ],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      };

      mockUserService.getUsers.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.data).toEqual(mockResult.users);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
      mockUserService.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/1')
        .expect(200);

      expect(response.body.data).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/1')
        .expect(404);

      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });
});
```

---

This document provides comprehensive patterns and best practices for Express.js development. Regular updates ensure alignment with current best practices and security standards.