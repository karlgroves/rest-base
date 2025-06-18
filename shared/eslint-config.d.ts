/**
 * Type definitions for eslint-config module
 */

export interface ESLintRule {
  [key: string]: any;
}

export interface ESLintEnvironment {
  node: boolean;
  jest: boolean;
  [key: string]: boolean;
}

export interface ESLintParserOptions {
  ecmaVersion: number;
  sourceType: string;
}

export interface ESLintConfiguration {
  extends: string;
  env: ESLintEnvironment;
  rules: Record<string, ESLintRule>;
  parserOptions: ESLintParserOptions;
}

/**
 * Gets the standard ESLint configuration object
 */
export declare function getEslintConfig(): ESLintConfiguration;

/**
 * Gets the ESLint configuration as a formatted string for .eslintrc.js files
 */
export declare function getEslintConfigString(): string;

/**
 * Gets a customized ESLint configuration with additional rules
 */
export declare function getCustomEslintConfig(customRules?: Record<string, ESLintRule>): ESLintConfiguration;