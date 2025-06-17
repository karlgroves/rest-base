/**
 * Shared ESLint Configuration
 * 
 * This module provides a standardized ESLint configuration
 * that can be used across all REST-SPEC projects.
 * 
 * @author REST-Base Team
 */

/**
 * Gets the standard ESLint configuration object
 * @returns {Object} ESLint configuration object
 */
function getEslintConfig() {
  return {
    extends: 'airbnb-base',
    env: {
      node: true,
      jest: true,
    },
    rules: {
      'comma-dangle': ['error', 'never'],
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'max-len': ['error', { code: 100, ignoreComments: true }],
      'no-console': ['warn'],
      'prefer-const': ['error'],
      'no-var': ['error']
    },
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  };
}

/**
 * Gets the ESLint configuration as a formatted string for .eslintrc.js files
 * @returns {string} Formatted ESLint configuration string
 */
function getEslintConfigString() {
  const config = getEslintConfig();
  return `module.exports = ${JSON.stringify(config, null, 2)};`;
}

/**
 * Gets a customized ESLint configuration with additional rules
 * @param {Object} customRules - Additional or override rules
 * @returns {Object} ESLint configuration object with custom rules
 */
function getCustomEslintConfig(customRules = {}) {
  const baseConfig = getEslintConfig();
  return {
    ...baseConfig,
    rules: {
      ...baseConfig.rules,
      ...customRules
    }
  };
}

module.exports = {
  getEslintConfig,
  getEslintConfigString,
  getCustomEslintConfig
};