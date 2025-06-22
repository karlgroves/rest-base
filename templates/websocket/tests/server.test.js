/**
 * Server Tests
 *
 * Test WebSocket server functionality
 * @author {{author}}
 */

const request = require('supertest');
const { app, server, io } = require('../src/server');
const { generateToken } = require('../src/middleware/auth');

describe('WebSocket Server', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('HTTP Endpoints', () => {
    test('GET / should return service information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        service: expect.any(String),
        version: '1.0.0',
        websocket: expect.objectContaining({
          endpoint: expect.any(String),
          transports: expect.arrayContaining(['websocket', 'polling'])
        }),
        environment: expect.any(String),
        timestamp: expect.any(String)
      });
    });

    test('GET /health should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        service: expect.any(String),
        version: '1.0.0',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    test('GET /health/detailed should return detailed health info', async () => {
      const response = await request(app).get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        service: expect.any(String),
        version: '1.0.0',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          rss: expect.any(Number),
          heapTotal: expect.any(Number),
          heapUsed: expect.any(Number),
          external: expect.any(Number)
        }),
        environment: expect.any(String),
        nodeVersion: expect.any(String),
        platform: expect.any(String),
        arch: expect.any(String)
      });
    });

    test('GET /health/live should return liveness status', async () => {
      const response = await request(app).get('/health/live');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'alive',
        timestamp: expect.any(String)
      });
    });

    test('GET /health/ready should return readiness status', async () => {
      const response = await request(app).get('/health/ready');
      
      // The readiness check may return 503 if uptime < 5 seconds
      if (response.status === 503) {
        expect(response.body).toMatchObject({
          status: 'not ready',
          reason: 'application starting up',
          timestamp: expect.any(String)
        });
      } else {
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: 'ready',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        });
      }
    });

    test('GET /stats should return connection statistics', async () => {
      const response = await request(app).get('/stats');
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        connections: expect.objectContaining({
          current: expect.any(Number),
          total: expect.any(Number),
          peak: expect.any(Number)
        }),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        timestamp: expect.any(String)
      });
    });

    test('GET /nonexistent should return 404', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: 'Not found',
        path: '/nonexistent',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to HTTP requests', async () => {
      // Make multiple requests rapidly
      const requests = Array(5).fill().map(() => request(app).get('/'));
      const responses = await Promise.all(requests);
      
      // All should succeed initially (within rate limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/')
        .send('invalid json{')
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(400);
    });
  });
});