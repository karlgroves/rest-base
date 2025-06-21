# REST-SPEC VS Code Extension

A comprehensive VS Code extension that provides code snippets, templates, and utilities for
developing REST APIs using REST-SPEC standards.

## Features

### 🚀 Code Snippets

The extension includes a comprehensive collection of code snippets for rapid development:

#### JavaScript Snippets

- **`rest-controller`** - Complete REST controller with CRUD operations
- **`rest-route`** - Express route with Swagger documentation
- **`sequelize-model`** - Sequelize model with associations and methods
- **`express-middleware`** - Express middleware function template
- **`jest-test`** - Complete Jest test suite template
- **`joi-schema`** - Joi validation schemas for CRUD operations

#### TypeScript Snippets

- **`ts-rest-controller`** - TypeScript REST controller with proper typing
- **`ts-interface`** - TypeScript interface definitions for API resources
- **`ts-service`** - TypeScript service class with business logic

#### JSON Configuration Snippets

- **`rest-package`** - Complete package.json for REST-SPEC projects
- **`eslint-config`** - ESLint configuration
- **`jest-config`** - Jest configuration
- **`docker-compose`** - Docker Compose setup
- **`swagger-def`** - Swagger/OpenAPI 3.0 definition

### 🛠️ Code Generation Commands

Access these commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **REST-SPEC: Create Controller** - Generate a complete REST controller
- **REST-SPEC: Create Middleware** - Create Express middleware
- **REST-SPEC: Create Model** - Generate Sequelize model
- **REST-SPEC: Create Route** - Create Express routes with Swagger docs
- **REST-SPEC: Create Test** - Generate test files (unit/integration/e2e)

### 📁 Context Menu Integration

Right-click in the Explorer to access REST-SPEC generators:

- Quick access to all generation commands
- Automatic file placement in appropriate directories
- Intelligent naming and structure

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "REST-SPEC"
4. Click Install

### Manual Installation

1. Download the `.vsix` file from releases
2. Open VS Code
3. Run `Extensions: Install from VSIX` command
4. Select the downloaded file

## Configuration

Configure the extension via VS Code settings:

```json
{
  "rest-spec.defaultAuthor": "Your Name",
  "rest-spec.useTypeScript": false,
  "rest-spec.includeJSDoc": true
}
```

### Configuration Options

| Setting                   | Type    | Default | Description                              |
| ------------------------- | ------- | ------- | ---------------------------------------- |
| `rest-spec.defaultAuthor` | string  | `""`    | Default author name for generated files  |
| `rest-spec.useTypeScript` | boolean | `false` | Generate TypeScript files by default     |
| `rest-spec.includeJSDoc`  | boolean | `true`  | Include JSDoc comments in generated code |

## Usage Examples

### Creating a User Controller

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "REST-SPEC: Create Controller"
3. Enter "User" as the model name
4. The extension will generate a complete controller with:
   - CRUD operations (GET, POST, PUT, DELETE)
   - Proper error handling
   - Pagination support
   - JSDoc documentation

### Using Snippets

1. Create a new JavaScript file
2. Type `rest-controller` and press Tab
3. Fill in the placeholders:
   - Model name (e.g., "Product")
   - Author name
4. The snippet expands to a complete controller implementation

### Generated File Structure

The extension creates files in the following structure:

```text
src/
├── controllers/     # Generated controllers
├── middlewares/     # Generated middleware
├── models/         # Generated Sequelize models
├── routes/         # Generated Express routes
└── services/       # Generated service classes
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

## Code Examples

### Generated Controller

```javascript
/**
 * User Controller
 *
 * Handles HTTP requests for User resources
 * @author Your Name
 */

const { User } = require("../models");
const { ValidationError, NotFoundError } = require("../utils/errors");
const logger = require("../utils/logger");

/**
 * Get all user records
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    const { rows: users, count } = await User.findAndCountAll({
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sort, order.toUpperCase()]],
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    next(error);
  }
};

// ... other CRUD methods

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
```

### Generated Route

```javascript
/**
 * User Routes
 *
 * Defines HTTP routes for User resources
 * @author Your Name
 */

const express = require("express");
const { validateRequest, authenticate, authorize } = require("../middlewares");
const userController = require("../controllers/userController");

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", authorize(["admin", "user"]), userController.getAllUsers);

// ... other routes

module.exports = router;
```

## Requirements

- VS Code 1.74.0 or higher
- Node.js project structure
- REST-SPEC standards compliance

## Supported File Types

- JavaScript (`.js`)
- TypeScript (`.ts`)
- JSON (`.json`)
- Markdown (`.md`)

## Extension Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/rest-spec/vscode-extension.git
cd vscode-extension

# Install dependencies
npm install

# Build the extension
npm run compile

# Package the extension
vsce package
```

### Testing

```bash
# Run tests
npm test

# Run extension in development mode
code --extensionDevelopmentPath=/path/to/extension
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Changelog

### 1.0.0

- Initial release
- Complete snippet library for JavaScript and TypeScript
- Code generation commands
- Context menu integration
- Configuration support

## Support

- 📖 [Documentation](https://github.com/rest-spec/rest-spec)
- 🐛 [Issue Tracker](https://github.com/rest-spec/rest-spec/issues)
- 💬 [Discussions](https://github.com/rest-spec/rest-spec/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Enjoy coding with REST-SPEC! 🚀
