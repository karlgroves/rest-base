/**
 * @fileoverview Jest test setup for API Gateway
 * @module tests/setup
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';
process.env.JWT_ISSUER = 'test-gateway';
process.env.JWT_AUDIENCE = 'test-users';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use test database
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test timeout
jest.setTimeout(30000);

// Mock Redis for tests that don't need real Redis
jest.mock('../src/services/redis.js', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  getRedisClient: jest.fn().mockReturnValue(null),
  isRedisConnected: jest.fn().mockReturnValue(false),
  disconnectRedis: jest.fn().mockResolvedValue(true),
  RedisKeys: {
    rateLimit: (id) => `test_rate_limit:${id}`,
    session: (id) => `test_session:${id}`,
    cache: (id) => `test_cache:${id}`,
    lock: (id) => `test_lock:${id}`,
    serviceHealth: (id) => `test_health:${id}`,
  },
  RedisCache: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(true),
    exists: jest.fn().mockResolvedValue(false),
    mset: jest.fn().mockResolvedValue(true),
  },
  RedisPubSub: {
    publish: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn().mockResolvedValue(true),
  },
}));

// Mock external service calls
global.fetch = jest.fn();

// Console spy for testing log outputs
global.consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  info: jest.spyOn(console, 'info').mockImplementation(() => {}),
};

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  if (global.fetch) {
    global.fetch.mockClear();
  }
});

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});