/**
 * @fileoverview Jest configuration for API Gateway tests
 * @module jest.config
 */

export default {
  // Test environment
  testEnvironment: 'node',

  // Use ES modules
  preset: 'node',
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/*.test.js',
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/gateway.js', // Main entry point, covered by integration tests
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Transform configuration
  transform: {},

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Error handling
  bail: false,
  errorOnDeprecated: true,

  // Parallel execution
  maxWorkers: '50%',

  // Watch mode configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/logs/',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/logs/',
  ],

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
      },
    ],
  ],
};