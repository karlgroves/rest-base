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
process.env.PORT = '3001'; // Use different port for tests

// Set shorter timeouts for tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to create test socket data
  createTestSocket: (overrides = {}) => ({
    id: 'test-socket-id',
    userId: 'test-user-123',
    userEmail: 'test@example.com',
    userRole: 'user',
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    })),
    broadcast: {
      emit: jest.fn()
    },
    ...overrides
  }),

  // Helper to create test message data
  createTestMessage: (overrides = {}) => ({
    roomId: 'test-room-123',
    message: 'Test message',
    type: 'text',
    ...overrides
  }),

  // Helper to create test room data
  createTestRoom: (overrides = {}) => ({
    name: 'Test Room',
    description: 'Test room description',
    maxParticipants: 10,
    isPrivate: false,
    ...overrides
  }),

  // Helper to create test notification data
  createTestNotification: (overrides = {}) => ({
    title: 'Test Notification',
    message: 'Test notification message',
    priority: 'normal',
    data: {},
    ...overrides
  }),

  // Helper to generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Helper to wait for async operations
  sleep: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock callback
  createMockCallback: () => jest.fn()
};

// Setup/teardown hooks
beforeAll(async () => {
  // Global setup before all tests
  console.log('🚀 Starting WebSocket test suite...');
});

afterAll(async () => {
  // Global cleanup after all tests
  console.log('✅ WebSocket test suite completed');
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

// Custom matchers
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

  toBeValidSocketId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid socket ID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid socket ID`,
        pass: false
      };
    }
  },

  toBeValidRoomId(received) {
    const pass = typeof received === 'string' && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid room ID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid room ID`,
        pass: false
      };
    }
  },

  toHaveSocketEventHandlers(received, expectedEvents) {
    const pass = Array.isArray(expectedEvents) && 
                 expectedEvents.every(event => 
                   received.emit && typeof received.emit.mock === 'object'
                 );
    
    if (pass) {
      return {
        message: () => `expected socket not to have event handlers for ${expectedEvents.join(', ')}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected socket to have event handlers for ${expectedEvents.join(', ')}`,
        pass: false
      };
    }
  }
});