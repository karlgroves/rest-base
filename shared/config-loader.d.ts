/**
 * Type definitions for config-loader module
 */

export interface RestSpecConfiguration {
  project: {
    nodeVersion: string;
    license: string;
    author: {
      name: string;
      email: string;
      url: string;
    };
    keywords: string[];
    git: {
      enabled: boolean;
      initialCommitMessage: string;
    };
  };
  directories: {
    src: string;
    tests: string;
    docs: string;
    public: string;
    srcSubdirs: string[];
    testSubdirs: string[];
    publicSubdirs: string[];
  };
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  scripts: Record<string, string>;
  eslint: {
    extends: string;
    env: Record<string, boolean>;
    rules: Record<string, any>;
    parserOptions: {
      ecmaVersion: number;
      sourceType: string;
    };
  };
  templates: {
    envExample: Record<string, Record<string, string>>;
  };
  cli: {
    progress: {
      enabled: boolean;
      style: 'phases' | 'steps' | 'simple';
    };
    colors: {
      enabled: boolean;
      theme: 'default' | 'minimal' | 'high-contrast';
    };
    prompts: {
      destructiveOperations: boolean;
      overwriteFiles: boolean;
    };
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      verbose: boolean;
    };
  };
  thresholds: {
    streamingThreshold: number;
    maxFileSize: number;
    maxProjectSize: number;
  };
  standardsFiles: string[];
  configFiles: string[];
}

/**
 * Loads and merges configuration from all available sources
 */
export declare function loadConfig(projectDir?: string): RestSpecConfiguration;

/**
 * Gets a specific configuration value using dot notation
 */
export declare function getConfigValue(
  key: string, 
  defaultValue?: any, 
  projectDir?: string
): any;

/**
 * Clears the configuration cache
 */
export declare function clearCache(): void;

/**
 * Validates the configuration for common issues
 */
export declare function validateConfig(config: Partial<RestSpecConfiguration>): string[];

/**
 * Deep merges two objects, with source taking precedence
 */
export declare function deepMerge(target: any, source: any): any;