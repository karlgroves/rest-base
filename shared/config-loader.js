/**
 * Configuration Loader
 * 
 * This module loads and merges configuration from multiple sources:
 * 1. Default configuration (rest-spec.config.js)
 * 2. User's home directory config (~/.rest-spec.config.js)
 * 3. Project directory config (./rest-spec.config.js)
 * 
 * @author REST-Base Team
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Cache for loaded configuration
let cachedConfig = null;

/**
 * Loads configuration from a file if it exists
 * @param {string} configPath - Path to configuration file
 * @returns {Object|null} Configuration object or null if file doesn't exist
 */
function loadConfigFile(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      // Clear require cache to allow hot reloading
      delete require.cache[require.resolve(configPath)];
      return require(configPath);
    }
  } catch (error) {
    console.warn(`Warning: Failed to load config from ${configPath}: ${error.message}`);
  }
  return null;
}

/**
 * Deep merges two objects, with source taking precedence
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Loads and merges configuration from all available sources
 * @param {string} projectDir - Project directory to look for config (optional)
 * @returns {Object} Merged configuration object
 */
function loadConfig(projectDir = process.cwd()) {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 1. Load default configuration
  const defaultConfigPath = path.join(__dirname, '..', 'rest-spec.config.js');
  let config = loadConfigFile(defaultConfigPath) || {};

  // 2. Load user's home directory config
  const homeConfigPath = path.join(os.homedir(), '.rest-spec.config.js');
  const homeConfig = loadConfigFile(homeConfigPath);
  if (homeConfig) {
    config = deepMerge(config, homeConfig);
  }

  // 3. Load project directory config
  const projectConfigPath = path.join(projectDir, 'rest-spec.config.js');
  const projectConfig = loadConfigFile(projectConfigPath);
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
  }

  // Cache the merged configuration
  cachedConfig = config;
  return config;
}

/**
 * Gets a specific configuration value using dot notation
 * @param {string} key - Configuration key using dot notation (e.g., 'project.nodeVersion')
 * @param {*} defaultValue - Default value if key is not found
 * @param {string} projectDir - Project directory (optional)
 * @returns {*} Configuration value
 */
function getConfigValue(key, defaultValue = undefined, projectDir = process.cwd()) {
  const config = loadConfig(projectDir);
  const keys = key.split('.');
  let value = config;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Clears the configuration cache (useful for testing or hot reloading)
 */
function clearCache() {
  cachedConfig = null;
}

/**
 * Validates the configuration for common issues
 * @param {Object} config - Configuration object to validate
 * @returns {Array} Array of validation errors
 */
function validateConfig(config) {
  const errors = [];

  // Validate required fields
  if (!config.project) {
    errors.push('Missing project configuration');
  }

  if (!config.directories) {
    errors.push('Missing directories configuration');
  }

  if (!config.dependencies) {
    errors.push('Missing dependencies configuration');
  }

  // Validate Node.js version format
  if (config.project && config.project.nodeVersion) {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(config.project.nodeVersion)) {
      errors.push(`Invalid Node.js version format: ${config.project.nodeVersion}`);
    }
  }

  // Validate directory names
  if (config.directories && config.directories.srcSubdirs) {
    const invalidDirRegex = /[<>:"|?*;\\&$`(){}[\]!]/;
    for (const dir of config.directories.srcSubdirs) {
      if (invalidDirRegex.test(dir)) {
        errors.push(`Invalid directory name: ${dir}`);
      }
    }
  }

  // Validate file size thresholds
  if (config.thresholds) {
    if (config.thresholds.streamingThreshold && config.thresholds.streamingThreshold < 0) {
      errors.push('Streaming threshold must be positive');
    }
    if (config.thresholds.maxFileSize && config.thresholds.maxFileSize < 0) {
      errors.push('Max file size must be positive');
    }
  }

  return errors;
}

module.exports = {
  loadConfig,
  getConfigValue,
  clearCache,
  validateConfig,
  deepMerge
};