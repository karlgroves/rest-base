/**
 * Error Reporter Module
 * 
 * Provides comprehensive error tracking and reporting for REST-SPEC CLI tools.
 * Features include error categorization, context capture, privacy protection,
 * and structured logging for monitoring and debugging.
 * 
 * @module shared/error-reporter
 * @author Karl Groves
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Error categories for classification
 */
const ErrorCategory = {
  USER_ERROR: 'USER_ERROR',           // User input or usage errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',       // System or environment errors
  NETWORK_ERROR: 'NETWORK_ERROR',     // Network related errors
  FILE_ERROR: 'FILE_ERROR',           // File system errors
  PERMISSION_ERROR: 'PERMISSION_ERROR', // Permission related errors
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR', // Missing or failed dependencies
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR', // Unhandled or unknown errors
  VALIDATION_ERROR: 'VALIDATION_ERROR', // Input validation errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR' // Configuration errors
};

/**
 * Error severity levels
 */
const ErrorSeverity = {
  LOW: 'LOW',         // Minor issues that don't prevent operation
  MEDIUM: 'MEDIUM',   // Issues that may affect functionality
  HIGH: 'HIGH',       // Critical issues that prevent operation
  CRITICAL: 'CRITICAL' // System-wide failures
};

/**
 * Privacy filter patterns for sanitizing sensitive data
 */
const PRIVACY_PATTERNS = [
  // API keys and tokens
  /[aA][pP][iI][-_]?[kK][eE][yY]\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  /[tT][oO][kK][eE][nN]\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  /[sS][eE][cC][rR][eE][tT]\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  
  // Passwords
  /[pP][aA][sS][sS][wW][oO][rR][dD]\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  /[pP][wW][dD]\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // IP addresses
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  
  // File paths with usernames
  /\/(?:home|users?)\/([^\/\s]+)/gi,
  /C:\\Users\\([^\\]+)/gi,
  
  // Database connection strings
  /(?:mongodb|mysql|postgres|postgresql):\/\/[^@]+@[^\/]+/gi,
  
  // Credit card numbers (basic pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Social Security Numbers (US)
  /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // JWT tokens
  /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g
];

class ErrorReporter {
  constructor() {
    this.errorLogPath = path.join(os.tmpdir(), 'rest-spec-errors');
    this.sessionId = this.generateSessionId();
    this.errorCount = 0;
    this.errorSummary = new Map();
    this.isEnabled = process.env.REST_SPEC_ERROR_REPORTING !== 'false';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Initialize error log directory
    this.initializeErrorLog();
  }

  /**
   * Generates a unique session ID for error tracking
   * @returns {string} Session ID
   */
  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Initializes the error log directory
   */
  async initializeErrorLog() {
    if (!this.isEnabled) return;
    
    try {
      await fs.mkdir(this.errorLogPath, { recursive: true });
    } catch (error) {
      // Silently fail if we can't create the directory
      this.isEnabled = false;
    }
  }

  /**
   * Categorizes an error based on its type and message
   * @param {Error} error - The error to categorize
   * @returns {string} Error category
   */
  categorizeError(error) {
    const errorString = error.toString().toLowerCase();
    const code = error.code || '';
    
    // File system errors
    if (code === 'ENOENT' || errorString.includes('no such file')) {
      return ErrorCategory.FILE_ERROR;
    }
    if (code === 'EACCES' || code === 'EPERM' || errorString.includes('permission')) {
      return ErrorCategory.PERMISSION_ERROR;
    }
    
    // Network errors
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || 
        errorString.includes('network') || errorString.includes('fetch')) {
      return ErrorCategory.NETWORK_ERROR;
    }
    
    // Dependency errors
    if (errorString.includes('cannot find module') || 
        errorString.includes('module not found')) {
      return ErrorCategory.DEPENDENCY_ERROR;
    }
    
    // Validation errors
    if (errorString.includes('invalid') || errorString.includes('validation')) {
      return ErrorCategory.VALIDATION_ERROR;
    }
    
    // Configuration errors
    if (errorString.includes('config') || errorString.includes('configuration')) {
      return ErrorCategory.CONFIGURATION_ERROR;
    }
    
    // User errors
    if (errorString.includes('usage:') || errorString.includes('must provide')) {
      return ErrorCategory.USER_ERROR;
    }
    
    // System errors
    if (code && code.startsWith('E')) {
      return ErrorCategory.SYSTEM_ERROR;
    }
    
    return ErrorCategory.UNEXPECTED_ERROR;
  }

  /**
   * Determines error severity based on category and impact
   * @param {string} category - Error category
   * @param {Object} context - Error context
   * @returns {string} Error severity
   */
  determineSeverity(category, context) {
    // Critical errors that prevent operation
    if (category === ErrorCategory.SYSTEM_ERROR || 
        category === ErrorCategory.PERMISSION_ERROR ||
        (context && context.fatal)) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors that affect functionality
    if (category === ErrorCategory.DEPENDENCY_ERROR ||
        category === ErrorCategory.CONFIGURATION_ERROR) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity errors
    if (category === ErrorCategory.NETWORK_ERROR ||
        category === ErrorCategory.FILE_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Low severity errors
    return ErrorSeverity.LOW;
  }

  /**
   * Sanitizes data to remove sensitive information
   * @param {*} data - Data to sanitize
   * @returns {*} Sanitized data
   */
  sanitizeData(data) {
    if (!data) return data;
    
    // Convert to string for pattern matching
    let dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Apply privacy patterns
    PRIVACY_PATTERNS.forEach(pattern => {
      dataString = dataString.replace(pattern, (match) => {
        // Preserve structure but redact content
        if (match.includes('@')) return '[REDACTED_EMAIL]';
        if (match.includes('://')) return '[REDACTED_URL]';
        if (match.match(/\d{4}[\s-]?\d{4}/)) return '[REDACTED_CARD]';
        if (match.match(/\d{3}-\d{2}-\d{4}/)) return '[REDACTED_SSN]';
        if (match.startsWith('eyJ')) return '[REDACTED_TOKEN]';
        if (match.match(/\/(?:home|users?)\//i)) return match.replace(/\/([^\/\s]+)/, '/[REDACTED_USER]');
        if (match.match(/C:\\Users\\/i)) return match.replace(/\\([^\\]+)/, '\\[REDACTED_USER]');
        return '[REDACTED]';
      });
    });
    
    // Parse back if original was object
    if (typeof data !== 'string') {
      try {
        return JSON.parse(dataString);
      } catch {
        return dataString;
      }
    }
    
    return dataString;
  }

  /**
   * Captures system context for error reporting
   * @returns {Object} System context
   */
  captureSystemContext() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      restSpecVersion: require('../package.json').version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: process.memoryUsage()
      },
      cpu: os.cpus().length,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      environment: this.isDevelopment ? 'development' : 'production'
    };
  }

  /**
   * Reports an error with full context
   * @param {Error} error - The error to report
   * @param {Object} options - Reporting options
   * @param {string} options.command - CLI command that caused the error
   * @param {Object} options.context - Additional context
   * @param {boolean} options.fatal - Whether the error is fatal
   * @returns {Object} Error report
   */
  async report(error, options = {}) {
    this.errorCount++;
    
    // Categorize and determine severity
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(category, options);
    
    // Build error report
    const errorReport = {
      id: crypto.randomBytes(8).toString('hex'),
      category,
      severity,
      message: this.sanitizeData(error.message),
      stack: this.isDevelopment ? this.sanitizeData(error.stack) : undefined,
      code: error.code,
      command: options.command || 'unknown',
      context: this.sanitizeData(options.context || {}),
      system: this.captureSystemContext(),
      timestamp: new Date().toISOString()
    };
    
    // Update error summary
    const summaryKey = `${category}:${error.code || error.message}`;
    this.errorSummary.set(summaryKey, (this.errorSummary.get(summaryKey) || 0) + 1);
    
    // Log based on severity
    this.logError(errorReport);
    
    // Save to error log if enabled
    if (this.isEnabled) {
      await this.saveErrorReport(errorReport);
    }
    
    return errorReport;
  }

  /**
   * Logs error based on severity
   * @param {Object} errorReport - Error report
   */
  logError(errorReport) {
    const { severity, category, message, command } = errorReport;
    
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL ERROR in ${command}: ${message}`, { category });
        break;
      case ErrorSeverity.HIGH:
        logger.error(`Error in ${command}: ${message}`, { category });
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`Warning in ${command}: ${message}`, { category });
        break;
      case ErrorSeverity.LOW:
        logger.info(`Minor issue in ${command}: ${message}`, { category });
        break;
    }
    
    // In development, show more details
    if (this.isDevelopment && errorReport.stack) {
      logger.debug('Stack trace:', errorReport.stack);
    }
  }

  /**
   * Saves error report to disk
   * @param {Object} errorReport - Error report to save
   */
  async saveErrorReport(errorReport) {
    try {
      const filename = `error-${errorReport.id}-${Date.now()}.json`;
      const filepath = path.join(this.errorLogPath, filename);
      
      await fs.writeFile(filepath, JSON.stringify(errorReport, null, 2), 'utf8');
      
      // Clean up old error files (keep last 100)
      await this.cleanupOldReports();
    } catch (error) {
      // Silently fail if we can't save the report
      logger.debug('Could not save error report:', error.message);
    }
  }

  /**
   * Cleans up old error reports
   */
  async cleanupOldReports() {
    try {
      const files = await fs.readdir(this.errorLogPath);
      const errorFiles = files
        .filter(f => f.startsWith('error-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.errorLogPath, f),
          time: f.match(/error-.*-(\d+)\.json/)?.[1] || 0
        }))
        .sort((a, b) => b.time - a.time);
      
      // Keep only the last 100 reports
      if (errorFiles.length > 100) {
        const toDelete = errorFiles.slice(100);
        await Promise.all(toDelete.map(f => fs.unlink(f.path).catch(() => {})));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Gets error summary for the current session
   * @returns {Object} Error summary
   */
  getErrorSummary() {
    const summary = {
      sessionId: this.sessionId,
      totalErrors: this.errorCount,
      errorsByCategory: {},
      topErrors: []
    };
    
    // Count errors by category
    for (const [key, count] of this.errorSummary.entries()) {
      const [category] = key.split(':');
      summary.errorsByCategory[category] = (summary.errorsByCategory[category] || 0) + count;
      summary.topErrors.push({ error: key, count });
    }
    
    // Sort top errors
    summary.topErrors.sort((a, b) => b.count - a.count);
    summary.topErrors = summary.topErrors.slice(0, 10);
    
    return summary;
  }

  /**
   * Generates an error report dashboard
   * @returns {Promise<string>} Dashboard content
   */
  async generateDashboard() {
    const summary = this.getErrorSummary();
    const recentErrors = await this.getRecentErrors();
    
    let dashboard = `# REST-SPEC Error Report Dashboard\n\n`;
    dashboard += `Generated: ${new Date().toISOString()}\n`;
    dashboard += `Session ID: ${summary.sessionId}\n\n`;
    
    dashboard += `## Summary\n\n`;
    dashboard += `- Total Errors: ${summary.totalErrors}\n`;
    dashboard += `- Error Categories:\n`;
    
    for (const [category, count] of Object.entries(summary.errorsByCategory)) {
      dashboard += `  - ${category}: ${count}\n`;
    }
    
    dashboard += `\n## Top Errors\n\n`;
    summary.topErrors.forEach((error, index) => {
      dashboard += `${index + 1}. ${error.error} (${error.count} occurrences)\n`;
    });
    
    dashboard += `\n## Recent Errors\n\n`;
    for (const error of recentErrors.slice(0, 10)) {
      dashboard += `### ${error.timestamp} - ${error.category} (${error.severity})\n`;
      dashboard += `- Command: ${error.command}\n`;
      dashboard += `- Message: ${error.message}\n`;
      dashboard += `- Error ID: ${error.id}\n\n`;
    }
    
    return dashboard;
  }

  /**
   * Gets recent error reports
   * @returns {Promise<Array>} Recent errors
   */
  async getRecentErrors() {
    try {
      const files = await fs.readdir(this.errorLogPath);
      const errorFiles = files
        .filter(f => f.startsWith('error-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.errorLogPath, f),
          time: parseInt(f.match(/error-.*-(\d+)\.json/)?.[1] || 0)
        }))
        .sort((a, b) => b.time - a.time)
        .slice(0, 20);
      
      const errors = [];
      for (const file of errorFiles) {
        try {
          const content = await fs.readFile(file.path, 'utf8');
          errors.push(JSON.parse(content));
        } catch {
          // Skip invalid files
        }
      }
      
      return errors;
    } catch {
      return [];
    }
  }

  /**
   * Creates an error handler wrapper for async functions
   * @param {Function} fn - Function to wrap
   * @param {string} command - Command name
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, command) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.report(error, {
          command,
          context: { args },
          fatal: true
        });
        throw error;
      }
    };
  }

  /**
   * Creates an error boundary for CLI commands
   * @param {Function} fn - Command function
   * @param {string} command - Command name
   * @returns {Function} Wrapped command
   */
  createErrorBoundary(fn, command) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const report = await this.report(error, {
          command,
          context: { args },
          fatal: true
        });
        
        // Show user-friendly error message
        logger.error(`An error occurred while running ${command}`);
        
        if (error.category === ErrorCategory.USER_ERROR) {
          logger.info('Please check your command usage and try again.');
        } else {
          logger.info(`Error ID: ${report.id}`);
          logger.info('This error has been logged for analysis.');
        }
        
        // Exit with appropriate code
        const exitCode = error.code === 'EACCES' ? 126 : 1;
        process.exit(exitCode);
      }
    };
  }
}

// Export singleton instance
module.exports = new ErrorReporter();
module.exports.ErrorCategory = ErrorCategory;
module.exports.ErrorSeverity = ErrorSeverity;