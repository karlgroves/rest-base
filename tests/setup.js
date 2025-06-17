/**
 * Jest Test Setup
 * 
 * This file contains global test setup and configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Uncomment to suppress specific log levels during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test helpers
global.testHelpers = {
  /**
   * Creates a temporary directory path for testing
   * @param {string} suffix - Optional suffix for the directory
   * @returns {string} Temporary directory path
   */
  getTempDir: (suffix = '') => {
    const os = require('os');
    const path = require('path');
    return path.join(os.tmpdir(), `rest-spec-test-${Date.now()}${suffix}`);
  },

  /**
   * Creates a mock configuration object for testing
   * @param {Object} overrides - Configuration overrides
   * @returns {Object} Mock configuration
   */
  createMockConfig: (overrides = {}) => {
    const defaultConfig = {
      directories: {
        src: 'src',
        tests: 'tests',
        docs: 'docs',
        public: 'public',
        srcSubdirs: ['config', 'controllers', 'middlewares', 'models', 'routes', 'services', 'utils'],
        testSubdirs: ['unit', 'integration', 'fixtures'],
        publicSubdirs: ['images', 'styles', 'scripts']
      },
      project: {
        nodeVersion: '22.11.0',
        license: 'MIT',
        keywords: ['rest', 'api', 'node', 'express'],
        author: { name: '', email: '', url: '' }
      },
      scripts: {
        start: 'node src/app.js',
        dev: 'nodemon src/app.js',
        test: 'jest'
      },
      dependencies: {
        production: { express: '^4.18.2' },
        development: { jest: '^29.7.0' }
      },
      standardsFiles: ['test-standard.md'],
      configFiles: ['.gitignore', '.markdownlint.json'],
      templates: {
        envExample: {
          server: { NODE_ENV: 'development', PORT: '3000' },
          database: { DB_HOST: 'localhost' }
        }
      },
      thresholds: {
        streamingThreshold: 1024 * 1024,
        maxFileSize: 10 * 1024 * 1024
      }
    };

    return { ...defaultConfig, ...overrides };
  },

  /**
   * Creates a mock file system structure for testing
   * @returns {Object} Mock file system structure
   */
  createMockFS: () => {
    const fs = require('fs');
    
    return {
      '/test/source/test-standard.md': 'Test standard content',
      '/test/source/.gitignore': 'node_modules/',
      '/test/source/.markdownlint.json': '{}',
      '/test/project/package.json': JSON.stringify({ name: 'test-project' })
    };
  }
};

// Increase timeout for integration tests
jest.setTimeout(30000);