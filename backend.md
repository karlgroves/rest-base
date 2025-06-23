# Backend Development Standards

This document outlines comprehensive standards and best practices for backend development in the UI-Base ecosystem.

## Table of Contents

1. [Architecture Standards](#architecture-standards)
2. [Node.js and Express.js Standards](#nodejs-and-expressjs-standards)
3. [API Design Principles](#api-design-principles)
4. [Database Standards](#database-standards)
5. [Security Standards](#security-standards)
6. [Error Handling](#error-handling)
7. [Testing Standards](#testing-standards)
8. [Performance Standards](#performance-standards)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Development Workflow](#development-workflow)

## Architecture Standards

### Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Data models
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── utils/           # Utility functions
├── config/          # Configuration files
├── validators/      # Input validation
├── types/           # TypeScript definitions
└── tests/           # Test files
```

### Design Patterns

- **MVC Pattern**: Separate concerns into Models, Views (API responses), and Controllers
- **Service Layer**: Business logic isolated from request handling
- **Repository Pattern**: Data access abstraction for database operations
- **Dependency Injection**: Use container for managing dependencies
- **Factory Pattern**: For creating instances of complex objects

### Code Organization

- **Single Responsibility**: Each module should have one reason to change
- **Separation of Concerns**: Keep business logic separate from framework code
- **DRY Principle**: Don't repeat yourself - extract common functionality
- **SOLID Principles**: Follow all five SOLID design principles

## Node.js and Express.js Standards

### Express.js Application Structure

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimit(rateLimitOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

module.exports = app;
```

### Middleware Standards

- **Order matters**: Security → Parsing → Routes → Error handling
- **Error handling**: Always use next() to pass errors to error handler
- **Validation**: Validate all inputs before processing
- **Authentication**: Implement JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)

### Controller Standards

```javascript
/**
 * User controller for handling user-related requests
 */
class UserController {
  /**
   * Get user by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await this.userService.findById(id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      res.json({
        data: user,
        meta: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Service Layer Standards

```javascript
/**
 * User service for business logic
 */
class UserService {
  constructor(userRepository, emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }
  
  async createUser(userData) {
    // Validate business rules
    await this.validateUserData(userData);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
    
    // Send welcome email (async)
    this.emailService.sendWelcomeEmail(user.email).catch(error => {
      logger.error('Failed to send welcome email', { error, userId: user.id });
    });
    
    return user;
  }
}
```

## API Design Principles

### RESTful Design

- **Resources**: Use nouns for endpoints (e.g., `/users`, `/orders`)
- **HTTP Methods**: Use appropriate methods (GET, POST, PUT, PATCH, DELETE)
- **Status Codes**: Return meaningful HTTP status codes
- **Idempotency**: PUT and DELETE should be idempotent
- **Stateless**: Each request should contain all necessary information

### Endpoint Naming

```
GET    /api/v1/users          # Get all users
GET    /api/v1/users/:id      # Get user by ID
POST   /api/v1/users          # Create new user
PUT    /api/v1/users/:id      # Update entire user
PATCH  /api/v1/users/:id      # Update partial user
DELETE /api/v1/users/:id      # Delete user

# Nested resources
GET    /api/v1/users/:id/orders    # Get user's orders
POST   /api/v1/users/:id/orders    # Create order for user
```

### Response Standards

```javascript
// Success response
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2023-10-01T12:00:00Z",
    "requestId": "req_123456789"
  }
}

// Error response
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "meta": {
    "timestamp": "2023-10-01T12:00:00Z",
    "requestId": "req_123456789"
  }
}

// Paginated response
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### API Versioning

- **URL Versioning**: `/api/v1/users` (recommended)
- **Header Versioning**: `Accept: application/vnd.api+json;version=1`
- **Backward Compatibility**: Maintain previous versions for at least 6 months
- **Deprecation Warnings**: Include deprecation headers for old versions

## Database Standards

### Schema Design

- **Normalization**: Follow third normal form (3NF) for OLTP systems
- **Constraints**: Use foreign key constraints and check constraints
- **Indexes**: Create indexes for frequently queried columns
- **Naming**: Use snake_case for table and column names
- **Timestamps**: Include created_at and updated_at for all tables

### Migration Standards

```javascript
// Migration example
exports.up = async function(knex) {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['is_active']);
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTable('users');
};
```

### Query Standards

- **Parameterized Queries**: Always use parameterized queries to prevent SQL injection
- **Connection Pooling**: Use connection pooling for better performance
- **Transactions**: Use transactions for multi-table operations
- **Query Optimization**: Monitor and optimize slow queries

```javascript
// Good - Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = ? AND is_active = ?',
  [email, true]
);

// Bad - String concatenation (SQL injection risk)
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

## Security Standards

### Authentication

- **JWT Tokens**: Use JWT for stateless authentication
- **Refresh Tokens**: Implement refresh token rotation
- **Password Hashing**: Use bcrypt with salt rounds ≥ 12
- **Session Management**: Secure session configuration

```javascript
// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '15m',
  issuer: 'ui-base-api',
  audience: 'ui-base-client'
};

// Password hashing
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### Authorization

- **Role-Based Access Control (RBAC)**: Implement user roles and permissions
- **Principle of Least Privilege**: Grant minimum required permissions
- **Resource-Level Authorization**: Check permissions for specific resources

```javascript
// Authorization middleware
const authorize = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const hasPermission = await permissionService.checkPermission(
        user.id, 
        permission, 
        req.params.id
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### Input Validation

- **Server-Side Validation**: Always validate on the server
- **Sanitization**: Sanitize all user inputs
- **Type Checking**: Validate data types and formats
- **Business Rules**: Validate business logic constraints

```javascript
const { body, validationResult } = require('express-validator');

const validateUser = [
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
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }
    next();
  }
];
```

## Error Handling

### Error Classes

```javascript
class ApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
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
```

### Global Error Handler

```javascript
const errorHandler = (error, req, res, next) => {
  // Log error
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    requestId: req.requestId
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
  
  // Handle programming errors
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
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
```

---

This document should be reviewed and updated quarterly to reflect best practices and technology changes.