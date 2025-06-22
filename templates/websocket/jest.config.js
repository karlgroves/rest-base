/**
 * Jest Configuration
 *
 * Testing configuration for WebSocket server
 * @author {{author}}
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude main server file from coverage
    '!src/**/*.config.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Test timeout
  testTimeout: 30000,

  // Clear mocks automatically
  clearMocks: true,

  // Restore mocks automatically
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Handle ES modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Module paths
  moduleDirectories: [
    'node_modules',
    'src'
  ],

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Max workers for parallel testing
  maxWorkers: '50%',

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true
};