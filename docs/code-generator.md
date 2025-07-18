# Code Generator for Common Patterns

Automatically generate boilerplate code for common Node.js/Express patterns following REST-SPEC conventions and best practices.

## Features

* **Complete CRUD Generation**: Generate full CRUD setup with one command
* **Multiple Templates**: Choose from pre-built templates for different patterns
* **Smart Naming**: Automatic case conversion (camelCase, PascalCase, kebab-case, etc.)
* **REST-SPEC Compliant**: Follows all REST-SPEC naming and structure conventions
* **Comprehensive Coverage**: Routes, controllers, models, middleware, tests, and validation
* **Configurable Output**: Specify output directories and customization options
* **JSDoc Ready**: Generated code includes proper JSDoc comments for API documentation

## Installation

The code generator is included with REST-SPEC. No additional installation required.

## Quick Start

```bash
# Generate complete CRUD for a "User" entity
npx rest-spec-code-gen crud user

# Generate individual components
npx rest-spec-code-gen route product
npx rest-spec-code-gen controller order
npx rest-spec-code-gen model category

# List available templates
npx rest-spec-code-gen list
```

## Commands

### CRUD Generation

Generate a complete CRUD setup with all necessary files:

```bash
npx rest-spec-code-gen crud <entity> [options]

# Examples
npx rest-spec-code-gen crud user
npx rest-spec-code-gen crud product --output ./api --author "John Doe"
```

This generates:

* **Model** (`src/models/User.js`) - Sequelize model with associations
* **Controller** (`src/controllers/userController.js`) - CRUD operations
* **Routes** (`src/routes/user.js`) - Express routes with documentation
* **Validation** (`src/schemas/user.js`) - Joi validation schemas
* **Tests** (`tests/controllers/user.test.js`) - Comprehensive test suite

### Individual Generators

#### Routes

```bash
npx rest-spec-code-gen route <entity> [options]

# Templates: crud, auth
npx rest-spec-code-gen route user --template crud
npx rest-spec-code-gen route auth --template auth
```

#### Controllers

```bash
npx rest-spec-code-gen controller <entity> [options]

# Templates: crud, auth
npx rest-spec-code-gen controller user --template crud
npx rest-spec-code-gen controller auth --template auth
```

#### Models

```bash
npx rest-spec-code-gen model <entity> [options]

# Templates: sequelize
npx rest-spec-code-gen model user --template sequelize
```

#### Middleware

```bash
npx rest-spec-code-gen middleware <entity> [options]

# Templates: validation, auth
npx rest-spec-code-gen middleware user --template validation
npx rest-spec-code-gen middleware auth --template auth
```

#### Tests

```bash
npx rest-spec-code-gen test <entity> [options]

# Templates: controller
npx rest-spec-code-gen test user --template controller
```

## Options

* `-o, --output <dir>` - Output directory (default: current directory)
* `-t, --template <template>` - Template type
* `-a, --author <author>` - Author name for file headers
* `--help` - Show help for specific commands

## Templates

### Route Templates

#### CRUD Template

Generates RESTful routes with full CRUD operations:

* `GET /api/entities` - List with pagination and filtering
* `GET /api/entities/:id` - Get by ID
* `POST /api/entities` - Create new entity
* `PUT /api/entities/:id` - Update entity
* `DELETE /api/entities/:id` - Delete entity

Features:

* Authentication middleware
* Input validation
* JSDoc API documentation
* Consistent error handling

#### Auth Template

Generates authentication routes:

* `POST /api/auth/register` - User registration
* `POST /api/auth/login` - User login
* `POST /api/auth/logout` - User logout
* `POST /api/auth/refresh` - Token refresh
* `POST /api/auth/reset-password` - Password reset
* `GET /api/auth/me` - Get current user

### Controller Templates

#### CRUD Controller

Generates controller with full CRUD operations:

* Pagination and sorting support
* Input validation
* Error handling and logging
* Database operations with Sequelize
* Proper HTTP status codes

#### Auth Controller

Generates authentication controller:

* User registration and login
* JWT token generation and validation
* Password hashing with bcrypt
* Email notifications
* Rate limiting support

### Model Templates

#### Sequelize Model

Generates Sequelize model with:

* UUID primary keys
* Common fields (name, description, status, timestamps)
* Associations setup
* Validation rules
* Instance and static methods
* Database indexes

### Middleware Templates

#### Validation Middleware

Generates Joi validation schemas:

* Create and update schemas
* Query parameter validation
* Custom validation rules
* Error formatting

#### Auth Middleware

Generates authentication middleware:

* JWT token verification
* Role-based authorization
* Rate limiting
* Optional authentication
* Owner authorization checks

### Test Templates

#### Controller Tests

Generates comprehensive test suite:

* Setup and teardown
* Authentication tests
* CRUD operation tests
* Validation tests
* Error handling tests
* Edge cases

## Generated Code Structure

When you run `npx rest-spec-code-gen crud user`, the following files are generated:

```text
src/
├── models/
│   └── User.js              # Sequelize model
├── controllers/
│   └── userController.js    # CRUD controller
├── routes/
│   └── user.js              # Express routes
├── schemas/
│   └── user.js              # Joi validation
tests/
└── controllers/
    └── user.test.js         # Test suite
```

## Example Generated Code

### Route Example

```javascript
/**
 * User Routes
 * 
 * CRUD operations for User resource
 * @author Developer
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { userSchema, updateUserSchema } = require('../schemas/user');

/**
 * @route GET /api/users
 * @summary Get all users
 * @description Retrieves a paginated list of users
 * @tag User
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @response 200 - List of users
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/', authenticate, userController.getAll);

// ... more routes
```

### Controller Example

```javascript
/**
 * User Controller
 * 
 * Controller for User CRUD operations
 * @author Developer
 */

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const User = require('../models/User');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Implementation with pagination, filtering, sorting
    // Error handling and logging
    
  } catch (error) {
    next(error);
  }
};

// ... more methods
```

## Naming Conventions

The generator automatically handles case conversions:

| Input | Case Type | Output |
|-------|-----------|--------|
| user | camelCase | user |
| user | PascalCase | User |
| user | kebab-case | user |
| user | snake_case | user |
| UserProfile | camelCase | userProfile |
| UserProfile | PascalCase | UserProfile |
| UserProfile | kebab-case | user-profile |
| UserProfile | snake_case | user_profile |

## Integration with Existing Projects

### Adding to Existing Express App

1. Generate the code in your project directory
2. Import routes in your main app file:

```javascript
const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);
```

3. Import models in your database setup:

```javascript
const User = require('./models/User');
// Set up associations
User.associate(models);
```

### Database Migrations

1. Generate Sequelize migrations for your models:

```bash
# After generating a model
npx sequelize-cli migration:generate --name create-user-table
```

### Testing Integration

1. Add test scripts to your package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:controllers": "jest tests/controllers/",
    "test:watch": "jest --watch"
  }
}
```

## Advanced Usage

### Custom Templates

You can modify the generator templates by editing `scripts/code-generator.js`. Templates use simple mustache-style variable replacement:

```javascript
const customTemplate = `
/**
 * {{entityName}} Custom
 * @author {{author}}
 */
const {{entityCamelCase}} = {
  // Custom implementation
};
`;
```

### Programmatic Usage

Use the generator in your own scripts:

```javascript
const { generateCode, generateCRUD } = require('./scripts/code-generator');

// Generate single component
await generateCode('controller', 'crud', 'user', {
  outputDir: './src',
  author: 'John Doe'
});

// Generate complete CRUD
await generateCRUD('product', {
  outputDir: './api',
  author: 'Development Team'
});
```

### Configuration File

Create a `.codegen.json` file for default options:

```json
{
  "outputDir": "./src",
  "author": "Your Name",
  "templates": {
    "route": "crud",
    "controller": "crud",
    "model": "sequelize"
  }
}
```

## Best Practices

1. **Review Generated Code**: Always review and customize generated code for your specific needs
2. **Follow Naming**: Use consistent entity naming (singular, PascalCase for models)
3. **Test Coverage**: Run generated tests and add additional test cases
4. **Validation Rules**: Customize validation schemas for your business logic
5. **Security**: Review and enhance authentication and authorization logic
6. **Documentation**: Update JSDoc comments with specific API details

## Common Patterns

### E-commerce API

```bash
# Generate core entities
npx rest-spec-code-gen crud product
npx rest-spec-code-gen crud category
npx rest-spec-code-gen crud order
npx rest-spec-code-gen crud customer

# Generate auth system
npx rest-spec-code-gen route auth --template auth
npx rest-spec-code-gen controller auth --template auth
```

### Blog API

```bash
# Generate blog entities
npx rest-spec-code-gen crud post
npx rest-spec-code-gen crud comment
npx rest-spec-code-gen crud tag
npx rest-spec-code-gen crud author
```

### Project Management API

```bash
# Generate PM entities
npx rest-spec-code-gen crud project
npx rest-spec-code-gen crud task
npx rest-spec-code-gen crud milestone
npx rest-spec-code-gen crud team
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you have write permissions to the output directory
2. **Template Not Found**: Use `list` command to see available templates
3. **Invalid Entity Names**: Use valid JavaScript identifiers for entity names
4. **File Overwrite**: Generator will overwrite existing files - backup important code

### Debug Mode

Run with debug output:

```bash
DEBUG=code-generator npx rest-spec-code-gen crud user
```

## Contributing

To add new templates or improve existing ones:

1. Edit `scripts/code-generator.js`
2. Add new templates to the appropriate section
3. Test with sample entities
4. Update documentation

## License

MIT License - see LICENSE file for details
