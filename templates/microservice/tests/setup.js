/**
 * Test Setup
 *
 * Global test configuration and setup
 * @author {{author}}
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise in tests

// Set shorter timeouts for tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestItem: (overrides = {}) => ({
    name: 'Test Item',
    description: 'Test Description',
    ...overrides
  }),

  // Helper to create multiple test items
  createTestItems: (count = 3) => {
    return Array.from({ length: count }, (_, index) => ({
      name: `Test Item ${index + 1}`,
      description: `Test Description ${index + 1}`
    }));
  },

  // Helper to generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Helper to wait for async operations
  sleep: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup/teardown hooks
beforeAll(async () => {
  // Global setup before all tests
  console.log('🚀 Starting test suite...');
});

afterAll(async () => {
  // Global cleanup after all tests
  console.log('✅ Test suite completed');
});

beforeEach(() => {
  // Setup before each test
  // Reset any global state if needed
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllMocks();
});

// Mock console methods to reduce test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Restore console for specific tests if needed
global.console.restore = () => {
  global.console = originalConsole;
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in tests, just log
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in tests, just log
});

// Custom matchers (if needed)
expect.extend({
  toBeValidTimestamp(received) {
    const pass = !isNaN(Date.parse(received));
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false
      };
    }
  },

  toBeValidId(received) {
    const pass = Number.isInteger(received) && received > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ID (positive integer)`,
        pass: false
      };
    }
  }
});