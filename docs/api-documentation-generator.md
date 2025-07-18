# API Documentation Generator

Automatically generate comprehensive API documentation from your Express.js routes with support for OpenAPI/Swagger, Markdown, and HTML formats.

## Features

* **Automatic Route Discovery**: Scans your project for Express route definitions
* **Multiple Output Formats**: OpenAPI 3.0 (JSON/YAML), Markdown, and HTML
* **JSDoc Support**: Extracts documentation from JSDoc comments
* **Smart Parameter Detection**: Automatically identifies path and query parameters
* **Customizable Output**: Configure titles, versions, servers, and more
* **Tag-based Organization**: Group endpoints by tags for better organization
* **Security Definitions**: Document authentication requirements
* **Beautiful HTML Output**: Responsive, styled documentation pages

## Installation

The API documentation generator is included with REST-SPEC. No additional installation required.

## Usage

### Command Line Interface

```bash
# Generate documentation for current project
npx rest-spec api-doc

# Specify custom options
npx rest-spec api-doc --project ./src --output ./docs/api --format openapi

# Use configuration file
npx rest-spec api-doc --config api-doc.config.json
```

### Available Options

* `-p, --project <path>` - Project path (default: current directory)
* `-o, --output <path>` - Output directory (default: ./api-docs)
* `-f, --format <format>` - Output format: openapi, markdown, html, all (default: all)
* `-c, --config <path>` - Configuration file path
* `--pattern <pattern>` - Route file pattern (default: **/routes/**/*.js)
* `--title <title>` - API documentation title
* `--version <version>` - API version
* `--server <url>` - Server URL

### Programmatic Usage

```javascript
const { 
  parseRouteFile, 
  findRouteFiles, 
  generateOpenAPI,
  generateMarkdown,
  generateHTML 
} = require('rest-spec/scripts/api-doc-generator');

// Parse routes from files
const routes = await parseRouteFile('./src/routes/users.js');

// Generate OpenAPI specification
const openapi = generateOpenAPI(routes, {
  title: 'My API',
  version: '1.0.0',
  servers: [{ url: 'https://api.example.com' }]
});

// Generate Markdown documentation
const markdown = generateMarkdown(routes, config);
```

## Configuration

Create an `api-doc.config.json` file in your project root:

```json
{
  "title": "My API Documentation",
  "version": "1.0.0",
  "description": "Comprehensive API documentation",
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Development server"
    },
    {
      "url": "https://api.example.com",
      "description": "Production server"
    }
  ],
  "tags": [
    {
      "name": "Authentication",
      "description": "Auth endpoints"
    }
  ],
  "patterns": [
    "**/routes/**/*.js",
    "**/api/**/*.js"
  ],
  "output": {
    "formats": ["openapi", "markdown", "html"],
    "directory": "./docs/api"
  }
}
```

## JSDoc Annotations

Document your routes using JSDoc comments:

```javascript
/**
 * @route GET /api/users
 * @summary Get all users
 * @description Retrieves a paginated list of all users in the system
 * @tag Users
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @param {string} [sort=createdAt] - Sort field
 * @param {string} [order=desc] - Sort order (asc/desc)
 * @response 200 - Successful response with user list
 * @response 400 - Invalid query parameters
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/users', authenticate, async (req, res) => {
  // Route implementation
});

/**
 * @route POST /api/users
 * @summary Create a new user
 * @description Creates a new user account with the provided information
 * @tag Users
 * @param {string} email - User email address
 * @param {string} password - User password (min 8 characters)
 * @param {string} name - User full name
 * @param {string} [role=user] - User role
 * @response 201 - User created successfully
 * @response 400 - Validation error
 * @response 409 - Email already exists
 * @security bearerAuth
 */
router.post('/users', authenticate, validate(userSchema), async (req, res) => {
  // Route implementation
});

/**
 * @route GET /api/users/:id
 * @summary Get user by ID
 * @description Retrieves detailed information about a specific user
 * @tag Users
 * @param {string} id - User ID
 * @response 200 - User found
 * @response 404 - User not found
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/users/:id', authenticate, async (req, res) => {
  // Route implementation
});
```

### Supported JSDoc Tags

* `@route <method> <path>` - Define route method and path
* `@summary <text>` - Short description of the endpoint
* `@description <text>` - Detailed description
* `@tag <name>` - Group endpoint under a tag
* `@param {type} [name] description` - Document parameters
* `@response <code> <description>` - Document response codes
* `@security <scheme>` - Specify security requirements

## Output Examples

### OpenAPI (JSON)

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0",
    "description": "API documentation"
  },
  "paths": {
    "/api/users": {
      "get": {
        "summary": "Get all users",
        "description": "Retrieves a paginated list of all users",
        "tags": ["Users"],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "required": false,
            "schema": { "type": "number" }
          }
        ],
        "responses": {
          "200": { "description": "Successful response" }
        },
        "security": [{ "bearerAuth": [] }]
      }
    }
  }
}
```

### Markdown Output

```markdown
# My API Documentation

## Endpoints

### Users

#### GET /api/users

Get all users

Retrieves a paginated list of all users in the system

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | number | No | Page number |
| limit | number | No | Items per page |

**Responses:**

| Status | Description |
|--------|-------------|
| 200 | Successful response |
| 401 | Unauthorized |

**Security:** bearerAuth
```

### HTML Output

The HTML output provides a beautiful, responsive documentation page with:

* Syntax highlighting
* Collapsible sections
* Search functionality
* Method color coding
* Mobile-friendly design

## Integration with CI/CD

Add to your build process:

```json
{
  "scripts": {
    "docs:api": "rest-spec api-doc",
    "build": "npm run test && npm run docs:api"
  }
}
```

### GitHub Actions Example

```yaml
name: Generate API Docs
on:
  push:
    branches: [main]
    paths:
      * 'src/routes/**'
      * 'src/api/**'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      * uses: actions/checkout@v3
      * uses: actions/setup-node@v3
      * run: npm ci
      * run: npm run docs:api
      * uses: actions/upload-artifact@v3
        with:
          name: api-docs
          path: docs/api/
```

## Best Practices

1. **Consistent JSDoc Comments**: Use JSDoc comments on all public endpoints
2. **Meaningful Summaries**: Write clear, concise endpoint summaries
3. **Document All Parameters**: Include type, requirement, and description
4. **Response Codes**: Document all possible response codes
5. **Security**: Clearly indicate authentication requirements
6. **Tags**: Use tags to organize related endpoints
7. **Examples**: Include request/response examples in descriptions
8. **Versioning**: Update version numbers when API changes

## Troubleshooting

### No routes found

* Check your route file pattern matches your project structure
* Ensure route files use standard Express syntax
* Verify files aren't being ignored

### Missing documentation

* Add JSDoc comments above route definitions
* Ensure comments include `@route` tag
* Check comment syntax is valid

### Parser errors

* Verify JavaScript syntax is valid
* Update to latest REST-SPEC version
* Check for unsupported syntax features

## Advanced Features

### Custom Templates

Create custom documentation templates:

```javascript
const customTemplate = {
  openapi: '3.0.0',
  info: {
    title: 'Custom API',
    'x-logo': {
      url: 'https://example.com/logo.png'
    }
  },
  // Custom extensions
  'x-tagGroups': [
    {
      name: 'Core',
      tags: ['Users', 'Auth']
    }
  ]
};
```

### Middleware Documentation

Document middleware functions:

```javascript
/**
 * @middleware authenticate
 * @description Verifies JWT token and attaches user to request
 * @header {string} Authorization - Bearer token
 * @error 401 - Invalid or missing token
 */
const authenticate = async (req, res, next) => {
  // Middleware implementation
};
```

### Schema Definitions

Document request/response schemas:

```javascript
/**
 * @schema User
 * @property {string} id - User ID
 * @property {string} email - Email address
 * @property {string} name - Full name
 * @property {string} role - User role
 * @property {date} createdAt - Creation timestamp
 */
```

## Contributing

To contribute to the API documentation generator:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT License - see LICENSE file for details
