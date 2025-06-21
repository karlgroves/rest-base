/**
 * Jest Configuration
 *
 * Testing configuration for {{projectName}}
 * @author {{author}}
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.js', '!src/config/**', '!src/migrations/**', '!src/seeders/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000
};
