/**
 * Integration tests for the configuration system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadConfig, getConfigValue, clearCache, validateConfig } = require('../../shared/config-loader');

describe('Configuration System Integration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rest-spec-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    clearCache();
  });

  afterEach(() => {
    // Clean up
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    clearCache();
  });

  describe('Configuration Loading and Merging', () => {
    it('should load default configuration when no custom configs exist', () => {
      const config = loadConfig(tempDir);
      
      expect(config).toBeDefined();
      expect(config.project).toBeDefined();
      expect(config.directories).toBeDefined();
      expect(config.dependencies).toBeDefined();
    });

    it('should merge project-specific configuration', () => {
      // Create a project-specific config
      const projectConfig = {
        project: {
          license: 'GPL-3.0'
        },
        customOption: 'test-value'
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'rest-spec.config.js'),
        `module.exports = ${JSON.stringify(projectConfig, null, 2)};`
      );

      const config = loadConfig(tempDir);
      
      expect(config.project.license).toBe('GPL-3.0');
      expect(config.customOption).toBe('test-value');
      // Should still have default values
      expect(config.directories).toBeDefined();
    });

    it('should handle missing or invalid config files gracefully', () => {
      // Create an invalid config file
      fs.writeFileSync(
        path.join(tempDir, 'rest-spec.config.js'),
        'invalid javascript syntax {'
      );

      expect(() => {
        loadConfig(tempDir);
      }).not.toThrow();
    });
  });

  describe('Configuration Value Retrieval', () => {
    it('should get nested configuration values', () => {
      const projectConfig = {
        project: {
          author: {
            name: 'Test Author',
            email: 'test@example.com'
          }
        }
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'rest-spec.config.js'),
        `module.exports = ${JSON.stringify(projectConfig, null, 2)};`
      );

      const authorName = getConfigValue('project.author.name', 'default', tempDir);
      const authorEmail = getConfigValue('project.author.email', 'default', tempDir);
      const missing = getConfigValue('project.missing.value', 'fallback', tempDir);
      
      expect(authorName).toBe('Test Author');
      expect(authorEmail).toBe('test@example.com');
      expect(missing).toBe('fallback');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate a complete configuration', () => {
      const config = loadConfig(tempDir);
      const errors = validateConfig(config);
      
      expect(Array.isArray(errors)).toBe(true);
      // Default config should be valid
      expect(errors.length).toBe(0);
    });

    it('should detect configuration errors', () => {
      const invalidConfig = {
        project: {
          nodeVersion: 'invalid-version'
        },
        directories: {
          srcSubdirs: ['valid-dir', 'invalid|dir']
        },
        dependencies: {},
        thresholds: {
          streamingThreshold: -1
        }
      };

      const errors = validateConfig(invalidConfig);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('Invalid Node.js version format'))).toBe(true);
      expect(errors.some(error => error.includes('Invalid directory name'))).toBe(true);
      expect(errors.some(error => error.includes('Streaming threshold must be positive'))).toBe(true);
    });
  });

  describe('Configuration Caching', () => {
    it('should cache configuration for performance', () => {
      const config1 = loadConfig(tempDir);
      const config2 = loadConfig(tempDir);
      
      // Should return the same object reference (cached)
      expect(config1).toBe(config2);
    });

    it('should reload configuration after cache clear', () => {
      const config1 = loadConfig(tempDir);
      
      // Modify config file
      const newConfig = { customValue: 'updated' };
      fs.writeFileSync(
        path.join(tempDir, 'rest-spec.config.js'),
        `module.exports = ${JSON.stringify(newConfig, null, 2)};`
      );
      
      // Should still return cached version
      const config2 = loadConfig(tempDir);
      expect(config2).toBe(config1);
      
      // Clear cache and reload
      clearCache();
      const config3 = loadConfig(tempDir);
      expect(config3).not.toBe(config1);
      expect(config3.customValue).toBe('updated');
    });
  });
});