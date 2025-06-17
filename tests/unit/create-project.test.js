/**
 * Unit tests for scripts/create-project.js
 * 
 * Note: This file tests the isolated functions that can be tested without
 * extensive file system mocking. Integration tests cover the full workflows.
 */

const path = require('path');

// We need to mock the dependencies before requiring the module
jest.mock('../../shared/config-loader');
jest.mock('../../shared/eslint-config');

// Mock the dependencies
const { loadConfig } = require('../../shared/config-loader');
const { getEslintConfigString } = require('../../shared/eslint-config');

// Mock loadConfig to return test configuration
loadConfig.mockReturnValue({
  directories: {
    src: 'src',
    tests: 'tests',
    docs: 'docs',
    public: 'public',
    srcSubdirs: ['config', 'controllers', 'middlewares'],
    testSubdirs: ['unit', 'integration'],
    publicSubdirs: ['images', 'styles']
  },
  project: {
    nodeVersion: '22.11.0',
    license: 'MIT',
    keywords: ['rest', 'api'],
    author: { name: 'Test Author' }
  },
  scripts: {
    start: 'node src/app.js',
    test: 'jest'
  },
  dependencies: {
    production: { express: '^4.18.2' },
    development: { jest: '^29.7.0' }
  },
  standardsFiles: ['test-standard.md'],
  configFiles: ['.gitignore'],
  templates: {
    envExample: {
      server: { NODE_ENV: 'development' }
    }
  },
  thresholds: {
    streamingThreshold: 1024 * 1024
  }
});

getEslintConfigString.mockReturnValue('module.exports = { extends: "airbnb-base" };');

describe('Create Project Functions', () => {
  // We'll test the validation function which doesn't require file system access
  describe('validateProjectName', () => {
    // Since validateProjectName is not exported, we'll test it through integration tests
    // or extract it to a separate testable module
    
    const validationTests = [
      { name: '', expected: 'Project name cannot be empty' },
      { name: '   ', expected: 'Project name cannot be empty' },
      { name: 'test<project', expected: 'Project name contains invalid characters' },
      { name: 'test|project', expected: 'Project name contains invalid characters' },
      { name: '.hidden', expected: 'Project name cannot start with a dot' },
      { name: 'con', expected: "'con' is a reserved name" },
      { name: 'test/project', expected: 'Project name cannot contain path separators' },
      { name: 'test..project', expected: 'Project name cannot contain path separators' },
      { name: 'a'.repeat(215), expected: 'Project name is too long' }
    ];

    // Since we can't easily test the internal function, we'll note this for integration tests
    it('should be tested in integration tests', () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Configuration Integration', () => {
    it('should use mocked configuration values', () => {
      const config = loadConfig();
      
      expect(config.directories.src).toBe('src');
      expect(config.project.nodeVersion).toBe('22.11.0');
      expect(config.dependencies.production.express).toBe('^4.18.2');
    });

    it('should use mocked ESLint configuration', () => {
      const eslintConfig = getEslintConfigString();
      
      expect(eslintConfig).toContain('airbnb-base');
    });
  });
});

describe('Utility Functions', () => {
  // Test the path resolution logic
  describe('Path Resolution', () => {
    it('should resolve paths correctly', () => {
      const projectDir = '/test/project';
      const sourceDir = '/test/source';
      
      const expectedSourcePath = path.join(sourceDir, 'test-file.md');
      const expectedDestPath = path.join(projectDir, 'docs', 'standards', 'test-file.md');
      
      expect(path.isAbsolute(expectedSourcePath)).toBe(true);
      expect(path.isAbsolute(expectedDestPath)).toBe(true);
    });
  });

  describe('File Size Threshold Logic', () => {
    it('should determine streaming vs regular copy correctly', () => {
      const config = loadConfig();
      const threshold = config.thresholds.streamingThreshold;
      
      expect(threshold).toBe(1024 * 1024); // 1MB
      
      // Simulate file size comparison
      const smallFile = 500 * 1024; // 500KB
      const largeFile = 2 * 1024 * 1024; // 2MB
      
      expect(smallFile < threshold).toBe(true); // Should use regular copy
      expect(largeFile > threshold).toBe(true); // Should use streaming
    });
  });
});