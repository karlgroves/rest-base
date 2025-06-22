/**
 * @fileoverview Tests for API Gateway main functionality
 * @module tests/gateway
 */

import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import createApp from '../src/gateway.js';

describe('API Gateway', () => {
  let app;

  beforeAll(async () => {
    // Create test app instance
    app = createApp();
  });

  describe('Root endpoint', () => {
    it('should return gateway information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        version: '1.0.0',
        status: 'operational',
        endpoints: expect.any(Object),
      });
    });

    it('should include required endpoint information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('api');
      expect(response.body.endpoints).toHaveProperty('admin');
    });
  });

  describe('Health endpoints', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        service: expect.any(String),
        version: '1.0.0',
        uptime: expect.any(Number),
        checks: expect.any(Object),
      });
    });

    it('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        system: expect.any(Object),
        dependencies: expect.any(Object),
        services: expect.any(Object),
      });
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready');

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('checks');
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toMatchObject({
        alive: true,
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('API endpoints', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toMatchObject({
        name: expect.stringContaining('API Gateway'),
        version: '1.0.0',
        availableVersions: expect.arrayContaining(['v1']),
        registeredServices: expect.any(Array),
      });
    });

    it('should redirect to v1 by default', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(301);

      expect(response.headers.location).toContain('/api/v1/test');
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Route not found'),
        code: expect.any(String),
      });
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS handling', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Request validation', () => {
    it('should require Content-Type for POST requests', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .send('test data')
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Content-Type'),
        code: 'MISSING_CONTENT_TYPE',
      });
    });

    it('should reject unsupported Content-Type', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .set('Content-Type', 'text/plain')
        .send('test data')
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Unsupported Content-Type'),
        code: 'UNSUPPORTED_CONTENT_TYPE',
      });
    });
  });
});