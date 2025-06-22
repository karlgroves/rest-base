/**
 * API Documentation Generator Tests
 */

const fs = require('fs').promises;
const path = require('path');
const {
  parseRouteFile,
  findRouteFiles,
  generateOpenAPI,
  generateMarkdown,
  generateHTML
} = require('../../scripts/api-doc-generator');

// Mock data
const mockRouteContent = `
const express = require('express');
const router = express.Router();

/**
 * @route GET /api/users
 * @summary Get all users
 * @description Retrieves a paginated list of all users
 * @tag Users
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @response 200 - Successful response
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/users', authenticate, async (req, res) => {
  res.json({ users: [] });
});

/**
 * @route POST /api/users
 * @summary Create a new user
 * @tag Users
 * @param {string} email - User email
 * @param {string} password - User password
 * @response 201 - User created
 * @response 400 - Validation error
 */
router.post('/users', validate, async (req, res) => {
  res.status(201).json({ user: {} });
});

/**
 * @route GET /api/users/:id
 * @summary Get user by ID
 * @tag Users
 * @param {string} id - User ID
 * @response 200 - User found
 * @response 404 - User not found
 */
router.get('/users/:id', async (req, res) => {
  res.json({ user: {} });
});

module.exports = router;
`;

describe('API Documentation Generator', () => {
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory
    tempDir = path.join(__dirname, '..', 'temp-api-doc-test');
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, 'routes'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('parseRouteFile', () => {
    test('should parse routes from file', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);

      const routes = await parseRouteFile(routeFile);

      expect(routes).toHaveLength(3);
      expect(routes[0]).toMatchObject({
        method: 'GET',
        path: '/users',
        summary: 'Get all users',
        description: 'Retrieves a paginated list of all users',
        tags: ['Users']
      });
      expect(routes[1]).toMatchObject({
        method: 'POST',
        path: '/users',
        summary: 'Create a new user',
        tags: ['Users']
      });
      expect(routes[2]).toMatchObject({
        method: 'GET',
        path: '/users/:id',
        summary: 'Get user by ID',
        tags: ['Users']
      });
    });

    test('should extract parameters from JSDoc', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);

      const routes = await parseRouteFile(routeFile);
      const getRoute = routes[0];

      expect(getRoute.parameters).toHaveLength(2);
      expect(getRoute.parameters[0]).toMatchObject({
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number'
      });
    });

    test('should extract responses from JSDoc', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);

      const routes = await parseRouteFile(routeFile);
      const getRoute = routes[0];

      expect(getRoute.responses).toMatchObject({
        '200': { description: 'Successful response' },
        '401': { description: 'Unauthorized' }
      });
    });

    test('should extract security requirements', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);

      const routes = await parseRouteFile(routeFile);
      const getRoute = routes[0];

      expect(getRoute.security).toContain('bearerAuth');
    });
  });

  describe('findRouteFiles', () => {
    test('should find route files matching pattern', async () => {
      await fs.writeFile(path.join(tempDir, 'routes', 'users.js'), mockRouteContent);
      await fs.writeFile(path.join(tempDir, 'routes', 'posts.js'), mockRouteContent);
      await fs.mkdir(path.join(tempDir, 'not-routes'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'not-routes', 'other.js'), mockRouteContent);

      const files = await findRouteFiles(tempDir, '**/routes/**/*.js');

      expect(files).toHaveLength(2);
      expect(files[0]).toContain('routes');
      expect(files[1]).toContain('routes');
    });

    test('should ignore node_modules and test directories', async () => {
      await fs.mkdir(path.join(tempDir, 'node_modules', 'routes'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'node_modules', 'routes', 'index.js'), mockRouteContent);
      await fs.mkdir(path.join(tempDir, 'test', 'routes'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'test', 'routes', 'test.js'), mockRouteContent);
      await fs.writeFile(path.join(tempDir, 'routes', 'users.js'), mockRouteContent);

      const files = await findRouteFiles(tempDir, '**/routes/**/*.js');

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('routes/users.js');
    });
  });

  describe('generateOpenAPI', () => {
    test('should generate valid OpenAPI specification', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const config = {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API Description',
        servers: [{ url: 'http://localhost:3000' }]
      };

      const openapi = generateOpenAPI(routes, config);

      expect(openapi).toMatchObject({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'Test API Description'
        },
        servers: [{ url: 'http://localhost:3000' }]
      });

      expect(openapi.paths).toHaveProperty('/users');
      expect(openapi.paths['/users']).toHaveProperty('get');
      expect(openapi.paths['/users']).toHaveProperty('post');
      expect(openapi.paths).toHaveProperty('/users/:id');
    });

    test('should include operation details', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const openapi = generateOpenAPI(routes, {});
      const getOperation = openapi.paths['/users'].get;

      expect(getOperation).toMatchObject({
        summary: 'Get all users',
        description: 'Retrieves a paginated list of all users',
        tags: ['Users'],
        security: [{ bearerAuth: [] }]
      });

      expect(getOperation.parameters).toHaveLength(2);
      expect(getOperation.responses).toHaveProperty('200');
      expect(getOperation.responses).toHaveProperty('401');
    });
  });

  describe('generateMarkdown', () => {
    test('should generate markdown documentation', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const config = {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API Description'
      };

      const markdown = generateMarkdown(routes, config);

      expect(markdown).toContain('# Test API');
      expect(markdown).toContain('Test API Description');
      expect(markdown).toContain('**Version:** 1.0.0');
      expect(markdown).toContain('## Endpoints');
      expect(markdown).toContain('### Users');
      expect(markdown).toContain('#### GET /users');
      expect(markdown).toContain('#### POST /users');
      expect(markdown).toContain('#### GET /users/:id');
    });

    test('should include parameter tables', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const markdown = generateMarkdown(routes, {});

      expect(markdown).toContain('**Parameters:**');
      expect(markdown).toContain('| Name | Type | Required | Description |');
      expect(markdown).toContain('| page | number | No | Page number |');
      expect(markdown).toContain('| email | string | Yes | User email |');
    });

    test('should include response tables', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const markdown = generateMarkdown(routes, {});

      expect(markdown).toContain('**Responses:**');
      expect(markdown).toContain('| Status | Description |');
      expect(markdown).toContain('| 200 | Successful response |');
      expect(markdown).toContain('| 201 | User created |');
      expect(markdown).toContain('| 404 | User not found |');
    });
  });

  describe('generateHTML', () => {
    test('should generate HTML documentation', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const config = {
        title: 'Test API',
        version: '1.0.0'
      };

      const html = generateHTML(routes, config);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Test API</title>');
      expect(html).toContain('<h1>Test API</h1>');
      expect(html).toContain('class="method method-GET"');
      expect(html).toContain('class="method method-POST"');
    });

    test('should include styled content', async () => {
      const routeFile = path.join(tempDir, 'routes', 'users.js');
      await fs.writeFile(routeFile, mockRouteContent);
      const routes = await parseRouteFile(routeFile);

      const html = generateHTML(routes, {});

      expect(html).toContain('<style>');
      expect(html).toContain('.method-GET { background: #27ae60; }');
      expect(html).toContain('.method-POST { background: #3498db; }');
      expect(html).toContain('<table');
      expect(html).toContain('<th>');
    });
  });

  describe('Edge cases', () => {
    test('should handle routes without JSDoc', async () => {
      const simpleRoute = `
        const router = require('express').Router();
        router.get('/simple', (req, res) => res.json({}));
        router.post('/simple', (req, res) => res.json({}));
      `;

      const routeFile = path.join(tempDir, 'routes', 'simple.js');
      await fs.writeFile(routeFile, simpleRoute);

      const routes = await parseRouteFile(routeFile);

      expect(routes).toHaveLength(2);
      expect(routes[0]).toMatchObject({
        method: 'GET',
        path: '/simple'
      });
      expect(routes[0].summary).toBeFalsy();
    });

    test('should handle dynamic route patterns', async () => {
      const dynamicRoute = `
        const router = require('express').Router();
        const basePath = '/api/v1';
        router.get(\`\${basePath}/users\`, handler);
        router.get(basePath + '/posts', handler);
      `;

      const routeFile = path.join(tempDir, 'routes', 'dynamic.js');
      await fs.writeFile(routeFile, dynamicRoute);

      const routes = await parseRouteFile(routeFile);

      expect(routes).toHaveLength(2);
      expect(routes[0].path).toBe('/api/v1/users');
    });

    test('should handle empty route files gracefully', async () => {
      const emptyFile = path.join(tempDir, 'routes', 'empty.js');
      await fs.writeFile(emptyFile, '// Empty file');

      const routes = await parseRouteFile(emptyFile);

      expect(routes).toHaveLength(0);
    });
  });
});