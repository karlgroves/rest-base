/**
 * Unit tests for shared/eslint-config.js
 */

const { getEslintConfig, getEslintConfigString, getCustomEslintConfig } = require('../../shared/eslint-config');

describe('ESLint Configuration', () => {
  describe('getEslintConfig', () => {
    it('should return a valid ESLint configuration object', () => {
      const config = getEslintConfig();
      
      expect(config).toBeDefined();
      expect(config.extends).toBe('airbnb-base');
      expect(config.env).toEqual({
        node: true,
        jest: true
      });
      expect(config.rules).toBeDefined();
      expect(config.parserOptions).toBeDefined();
    });

    it('should include required rules', () => {
      const config = getEslintConfig();
      
      expect(config.rules['comma-dangle']).toEqual(['error', 'never']);
      expect(config.rules['no-unused-vars']).toEqual(['error', { argsIgnorePattern: 'next' }]);
      expect(config.rules['max-len']).toEqual(['error', { code: 100, ignoreComments: true }]);
      expect(config.rules['no-console']).toEqual(['warn']);
      expect(config.rules['prefer-const']).toEqual(['error']);
      expect(config.rules['no-var']).toEqual(['error']);
    });

    it('should have correct parser options', () => {
      const config = getEslintConfig();
      
      expect(config.parserOptions.ecmaVersion).toBe(2022);
      expect(config.parserOptions.sourceType).toBe('module');
    });
  });

  describe('getEslintConfigString', () => {
    it('should return a properly formatted string', () => {
      const configString = getEslintConfigString();
      
      expect(configString).toBeDefined();
      expect(configString).toContain('module.exports =');
      expect(configString).toContain('airbnb-base');
      expect(configString).toContain('comma-dangle');
    });

    it('should be valid JavaScript when evaluated', () => {
      const configString = getEslintConfigString();
      
      // Remove the module.exports part and parse as JSON
      const jsonPart = configString.replace('module.exports = ', '').replace(';', '');
      
      expect(() => {
        JSON.parse(jsonPart);
      }).not.toThrow();
    });
  });

  describe('getCustomEslintConfig', () => {
    it('should merge custom rules with base configuration', () => {
      const customRules = {
        'no-console': ['error'],
        'custom-rule': ['warn']
      };
      
      const config = getCustomEslintConfig(customRules);
      
      expect(config.extends).toBe('airbnb-base');
      expect(config.rules['no-console']).toEqual(['error']); // overridden
      expect(config.rules['custom-rule']).toEqual(['warn']); // added
      expect(config.rules['comma-dangle']).toEqual(['error', 'never']); // preserved
    });

    it('should work with empty custom rules', () => {
      const config = getCustomEslintConfig({});
      const baseConfig = getEslintConfig();
      
      expect(config).toEqual(baseConfig);
    });

    it('should work with no custom rules parameter', () => {
      const config = getCustomEslintConfig();
      const baseConfig = getEslintConfig();
      
      expect(config).toEqual(baseConfig);
    });
  });
});