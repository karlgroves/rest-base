/**
 * Test Setup Configuration
 *
 * Global test setup for {{projectName}}
 * @author {{author}}
 */

require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test hooks
beforeAll(async () => {
  // Global setup before all tests
  // eslint-disable-next-line no-console
  console.log('Starting test suite...');
});

afterAll(async () => {
  // Global cleanup after all tests
  // eslint-disable-next-line no-console
  console.log('Test suite completed.');
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});
