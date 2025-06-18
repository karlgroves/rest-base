/**
 * TypeScript type definitions for REST-SPEC shared modules
 */

// Configuration types
export interface ProjectConfig {
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
}

export interface DirectoriesConfig {
  src: string;
  tests: string;
  docs: string;
  public: string;
  srcSubdirs: string[];
  testSubdirs: string[];
  publicSubdirs: string[];
}

export interface DependenciesConfig {
  production: Record<string, string>;
  development: Record<string, string>;
}

export interface ScriptsConfig {
  start: string;
  dev: string;
  test: string;
  'test:watch': string;
  'test:coverage': string;
  'lint:md': string;
  'lint:js': string;
  lint: string;
  [key: string]: string;
}

export interface ESLintConfig {
  extends: string;
  env: {
    node: boolean;
    jest: boolean;
    [key: string]: boolean;
  };
  rules: Record<string, any>;
  parserOptions: {
    ecmaVersion: number;
    sourceType: string;
  };
}

export interface TemplatesConfig {
  envExample: Record<string, Record<string, string>>;
}

export interface CLIConfig {
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
}

export interface ThresholdsConfig {
  streamingThreshold: number;
  maxFileSize: number;
  maxProjectSize: number;
}

export interface RestSpecConfig {
  project: ProjectConfig;
  directories: DirectoriesConfig;
  dependencies: DependenciesConfig;
  scripts: ScriptsConfig;
  eslint: ESLintConfig;
  templates: TemplatesConfig;
  cli: CLIConfig;
  thresholds: ThresholdsConfig;
  standardsFiles: string[];
  configFiles: string[];
}

// ESLint configuration module types
export interface ESLintConfigModule {
  getEslintConfig(): ESLintConfig;
  getEslintConfigString(): string;
  getCustomEslintConfig(customRules?: Record<string, any>): ESLintConfig;
}

// Configuration loader module types
export interface ConfigLoaderModule {
  loadConfig(projectDir?: string): RestSpecConfig;
  getConfigValue(key: string, defaultValue?: any, projectDir?: string): any;
  clearCache(): void;
  validateConfig(config: Partial<RestSpecConfig>): string[];
  deepMerge(target: any, source: any): any;
}

// CLI script types
export interface CreateProjectOptions {
  projectName: string;
  projectDir: string;
  sourceDir: string;
}

export interface SetupStandardsOptions {
  targetDir: string;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Logger types
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// File operation types
export interface FileOperationOptions {
  source: string;
  destination: string;
  threshold?: number;
}

export interface CopyResult {
  success: boolean;
  bytesTransferred?: number;
  method: 'regular' | 'streaming';
}

// Project structure types
export interface ProjectStructure {
  directories: string[];
  files: Array<{
    path: string;
    content: string;
    template?: boolean;
  }>;
}

// Git operation types
export interface GitOperationResult {
  success: boolean;
  operation: 'init' | 'add' | 'commit';
  message?: string;
}

// Color theme types
export type ColorTheme = {
  reset: string;
  green: string;
  yellow: string;
  blue: string;
  red: string;
  cyan?: string;
  gray?: string;
};

// Progress indicator types
export interface ProgressIndicator {
  phase: number;
  totalPhases: number;
  step?: number;
  totalSteps?: number;
  message: string;
  completed: boolean;
}

// Rollback operation types
export interface RollbackOperation {
  type: 'file' | 'directory' | 'git';
  path: string;
  action: 'remove' | 'restore' | 'reset';
  success: boolean;
  error?: string;
}

export interface RollbackResult {
  operations: RollbackOperation[];
  totalOperations: number;
  successfulOperations: number;
  summary: string[];
}

// Package.json types
export interface PackageJsonData {
  name: string;
  version: string;
  description: string;
  main: string;
  scripts: ScriptsConfig;
  keywords: string[];
  author: string;
  license: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines: {
    node: string;
  };
}

// Environment configuration types
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  LOG_LEVEL: string;
}

// Test configuration types
export interface TestConfig {
  testEnvironment: string;
  setupFilesAfterEnv: string[];
  testMatch: string[];
  collectCoverageFrom: string[];
  coverageDirectory: string;
  coverageReporters: string[];
  coverageThreshold: {
    global: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
  };
}

// CLI command types
export type CLICommand = 'create-project' | 'setup-standards';

export interface CLIResult {
  success: boolean;
  exitCode: number;
  message?: string;
  rollback?: RollbackResult;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = T & Partial<Pick<T, K>>;

// Function types for CLI scripts
export type ProjectValidator = (name: string) => string;
export type FileCreator = (projectDir: string, data: any) => Promise<void>;
export type DirectoryCreator = (projectDir: string) => Promise<void>;
export type ConfigFileWriter = (projectDir: string, config: RestSpecConfig) => Promise<void>;
export type DependencyInstaller = (dependencies: string[]) => Promise<boolean>;
export type GitInitializer = (projectDir: string) => Promise<GitOperationResult>;
export type ProgressReporter = (indicator: ProgressIndicator) => void;
export type ErrorHandler = (error: Error, context: string) => void;
export type RollbackHandler = (projectDir: string, projectName: string) => Promise<RollbackResult>;

// Module exports
declare module '../shared/eslint-config' {
  const module: ESLintConfigModule;
  export = module;
}

declare module '../shared/config-loader' {
  const module: ConfigLoaderModule;
  export = module;
}