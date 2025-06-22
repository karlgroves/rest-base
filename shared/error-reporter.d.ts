/**
 * Error Reporter Type Definitions
 * 
 * @module shared/error-reporter
 */

export interface ErrorReportOptions {
  /** CLI command that caused the error */
  command?: string;
  /** Additional context for the error */
  context?: Record<string, any>;
  /** Whether the error is fatal */
  fatal?: boolean;
}

export interface ErrorReport {
  /** Unique error ID */
  id: string;
  /** Error category */
  category: string;
  /** Error severity */
  severity: string;
  /** Sanitized error message */
  message: string;
  /** Sanitized stack trace (development only) */
  stack?: string;
  /** Error code */
  code?: string;
  /** Command that generated the error */
  command: string;
  /** Additional context */
  context: Record<string, any>;
  /** System information */
  system: SystemContext;
  /** ISO timestamp */
  timestamp: string;
}

export interface SystemContext {
  /** Operating system platform */
  platform: string;
  /** System architecture */
  arch: string;
  /** Node.js version */
  nodeVersion: string;
  /** REST-SPEC version */
  restSpecVersion: string;
  /** Memory information */
  memory: {
    total: number;
    free: number;
    used: NodeJS.MemoryUsage;
  };
  /** Number of CPUs */
  cpu: number;
  /** ISO timestamp */
  timestamp: string;
  /** Session ID */
  sessionId: string;
  /** Environment (development/production) */
  environment: string;
}

export interface ErrorSummary {
  /** Session ID */
  sessionId: string;
  /** Total number of errors */
  totalErrors: number;
  /** Errors grouped by category */
  errorsByCategory: Record<string, number>;
  /** Top errors with counts */
  topErrors: Array<{
    error: string;
    count: number;
  }>;
}

export declare const ErrorCategory: {
  readonly USER_ERROR: "USER_ERROR";
  readonly SYSTEM_ERROR: "SYSTEM_ERROR";
  readonly NETWORK_ERROR: "NETWORK_ERROR";
  readonly FILE_ERROR: "FILE_ERROR";
  readonly PERMISSION_ERROR: "PERMISSION_ERROR";
  readonly DEPENDENCY_ERROR: "DEPENDENCY_ERROR";
  readonly UNEXPECTED_ERROR: "UNEXPECTED_ERROR";
  readonly VALIDATION_ERROR: "VALIDATION_ERROR";
  readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
};

export declare const ErrorSeverity: {
  readonly LOW: "LOW";
  readonly MEDIUM: "MEDIUM";
  readonly HIGH: "HIGH";
  readonly CRITICAL: "CRITICAL";
};

declare class ErrorReporter {
  constructor();
  
  /** Reports an error with full context */
  report(error: Error, options?: ErrorReportOptions): Promise<ErrorReport>;
  
  /** Gets error summary for the current session */
  getErrorSummary(): ErrorSummary;
  
  /** Generates an error report dashboard */
  generateDashboard(): Promise<string>;
  
  /** Gets recent error reports */
  getRecentErrors(): Promise<ErrorReport[]>;
  
  /** Creates an error handler wrapper for async functions */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    command: string
  ): T;
  
  /** Creates an error boundary for CLI commands */
  createErrorBoundary<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    command: string
  ): T;
  
  /** Categorizes an error based on its type and message */
  categorizeError(error: Error): string;
  
  /** Determines error severity based on category and impact */
  determineSeverity(category: string, context?: any): string;
  
  /** Sanitizes data to remove sensitive information */
  sanitizeData(data: any): any;
}

declare const errorReporter: ErrorReporter;
export default errorReporter;