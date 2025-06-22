/**
 * Error Reporter Unit Tests
 * 
 * @jest-environment node
 */

const errorReporter = require('../../shared/error-reporter');
const { ErrorCategory, ErrorSeverity } = require('../../shared/error-reporter');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock logger to prevent console output during tests
jest.mock('../../shared/logger', () => ({
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  heading: jest.fn(),
  subheading: jest.fn(),
  labelValue: jest.fn(),
  highlight: jest.fn(),
  muted: jest.fn()
}));

describe('Error Reporter', () => {
  beforeEach(() => {
    // Reset error count and summary
    errorReporter.errorCount = 0;
    errorReporter.errorSummary.clear();
    // Enable error reporting for tests
    errorReporter.isEnabled = true;
  });

  describe('Error Categorization', () => {
    test('should categorize file errors correctly', () => {
      const error = new Error('ENOENT: no such file or directory');
      error.code = 'ENOENT';
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.FILE_ERROR);
    });

    test('should categorize permission errors correctly', () => {
      const error = new Error('EACCES: permission denied');
      error.code = 'EACCES';
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.PERMISSION_ERROR);
    });

    test('should categorize network errors correctly', () => {
      const error = new Error('ECONNREFUSED: connection refused');
      error.code = 'ECONNREFUSED';
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.NETWORK_ERROR);
    });

    test('should categorize dependency errors correctly', () => {
      const error = new Error("Cannot find module 'missing-module'");
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.DEPENDENCY_ERROR);
    });

    test('should categorize validation errors correctly', () => {
      const error = new Error('Invalid input provided');
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.VALIDATION_ERROR);
    });

    test('should categorize user errors correctly', () => {
      const error = new Error('Usage: command <argument>');
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.USER_ERROR);
    });

    test('should categorize unexpected errors as fallback', () => {
      const error = new Error('Some random error');
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.UNEXPECTED_ERROR);
    });

    test('should handle custom category property', () => {
      const error = new Error('Custom error');
      error.category = ErrorCategory.CONFIGURATION_ERROR;
      expect(errorReporter.categorizeError(error)).toBe(ErrorCategory.CONFIGURATION_ERROR);
    });
  });

  describe('Severity Determination', () => {
    test('should mark system errors as critical', () => {
      const severity = errorReporter.determineSeverity(ErrorCategory.SYSTEM_ERROR, {});
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('should mark permission errors as critical', () => {
      const severity = errorReporter.determineSeverity(ErrorCategory.PERMISSION_ERROR, {});
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('should mark dependency errors as high', () => {
      const severity = errorReporter.determineSeverity(ErrorCategory.DEPENDENCY_ERROR, {});
      expect(severity).toBe(ErrorSeverity.HIGH);
    });

    test('should mark network errors as medium', () => {
      const severity = errorReporter.determineSeverity(ErrorCategory.NETWORK_ERROR, {});
      expect(severity).toBe(ErrorSeverity.MEDIUM);
    });

    test('should mark user errors as low', () => {
      const severity = errorReporter.determineSeverity(ErrorCategory.USER_ERROR, {});
      expect(severity).toBe(ErrorSeverity.LOW);
    });

    test('should respect fatal context flag', () => {
      const severity = errorReporter.determineSeverity(ErrorCategory.USER_ERROR, { fatal: true });
      expect(severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize API keys', () => {
      const data = 'API_KEY=sk_test_1234567890abcdef';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('API_KEY=[REDACTED]');
    });

    test('should sanitize passwords', () => {
      const data = 'password: mysecretpassword123';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('password: [REDACTED]');
    });

    test('should sanitize email addresses', () => {
      const data = 'Contact: user@example.com for support';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toContain('[REDACTED_EMAIL]');
    });

    test('should sanitize IP addresses', () => {
      const data = 'Server at 192.168.1.100';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('Server at [REDACTED]');
    });

    test('should sanitize file paths with usernames', () => {
      const data = '/home/username/project/file.js';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('/home/[REDACTED_USER]/project/file.js');
    });

    test('should sanitize Windows paths', () => {
      const data = 'C:\\Users\\JohnDoe\\Documents\\project';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('C:\\Users\\[REDACTED_USER]\\Documents\\project');
    });

    test('should sanitize database URLs', () => {
      const data = 'mongodb://user:pass@localhost:27017/db';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('[REDACTED_URL]');
    });

    test('should sanitize JWT tokens', () => {
      const data = 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized).toBe('token=[REDACTED_TOKEN]');
    });

    test('should sanitize objects', () => {
      const data = {
        apiKey: 'secret123',
        email: 'test@example.com',
        safe: 'this is fine'
      };
      const sanitized = errorReporter.sanitizeData(data);
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.email).toBe('[REDACTED_EMAIL]');
      expect(sanitized.safe).toBe('this is fine');
    });

    test('should handle null and undefined', () => {
      expect(errorReporter.sanitizeData(null)).toBe(null);
      expect(errorReporter.sanitizeData(undefined)).toBe(undefined);
    });
  });

  describe('Error Reporting', () => {
    test('should create error report with all fields', async () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      
      const report = await errorReporter.report(error, {
        command: 'test-command',
        context: { foo: 'bar' },
        fatal: false
      });

      expect(report).toMatchObject({
        category: expect.any(String),
        severity: expect.any(String),
        message: 'Test error',
        code: 'TEST_ERROR',
        command: 'test-command',
        context: { foo: 'bar' },
        timestamp: expect.any(String),
        id: expect.any(String)
      });
    });

    test('should increment error count', async () => {
      const initialCount = errorReporter.errorCount;
      
      await errorReporter.report(new Error('Test 1'), { command: 'test' });
      await errorReporter.report(new Error('Test 2'), { command: 'test' });
      
      expect(errorReporter.errorCount).toBe(initialCount + 2);
    });

    test('should update error summary', async () => {
      await errorReporter.report(new Error('Test error'), { command: 'test' });
      await errorReporter.report(new Error('Test error'), { command: 'test' });
      
      const summary = errorReporter.getErrorSummary();
      expect(summary.totalErrors).toBe(2);
      expect(summary.topErrors[0].count).toBe(2);
    });

    test('should exclude stack trace in production', async () => {
      errorReporter.isDevelopment = false;
      
      const error = new Error('Test error');
      const report = await errorReporter.report(error, { command: 'test' });
      
      expect(report.stack).toBeUndefined();
    });

    test('should include stack trace in development', async () => {
      errorReporter.isDevelopment = true;
      
      const error = new Error('Test error');
      const report = await errorReporter.report(error, { command: 'test' });
      
      expect(report.stack).toBeDefined();
    });
  });

  describe('Error Summary', () => {
    test('should generate correct summary', async () => {
      // Report various errors
      await errorReporter.report(new Error('File not found'), { command: 'read' });
      await errorReporter.report(new Error('Permission denied'), { command: 'write' });
      await errorReporter.report(new Error('File not found'), { command: 'read' });
      
      const summary = errorReporter.getErrorSummary();
      
      expect(summary.totalErrors).toBe(3);
      expect(summary.sessionId).toBeDefined();
      expect(summary.errorsByCategory).toBeDefined();
      expect(summary.topErrors).toHaveLength(2);
      expect(summary.topErrors[0].count).toBe(2);
    });

    test('should handle empty summary', () => {
      const summary = errorReporter.getErrorSummary();
      
      expect(summary.totalErrors).toBe(0);
      expect(summary.errorsByCategory).toEqual({});
      expect(summary.topErrors).toEqual([]);
    });
  });

  describe('Async Wrapper', () => {
    test('should wrap async function successfully', async () => {
      const testFn = jest.fn().mockResolvedValue('success');
      const wrapped = errorReporter.wrapAsync(testFn, 'test-fn');
      
      const result = await wrapped('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should report errors from wrapped function', async () => {
      const testError = new Error('Async error');
      const testFn = jest.fn().mockRejectedValue(testError);
      const wrapped = errorReporter.wrapAsync(testFn, 'test-fn');
      
      await expect(wrapped('arg1')).rejects.toThrow('Async error');
      
      const summary = errorReporter.getErrorSummary();
      expect(summary.totalErrors).toBe(1);
    });
  });

  describe('Error Boundary', () => {
    test('should handle successful execution', async () => {
      const testFn = jest.fn().mockResolvedValue('success');
      const wrapped = errorReporter.createErrorBoundary(testFn, 'test-command');
      
      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      await wrapped('arg1');
      
      expect(testFn).toHaveBeenCalledWith('arg1');
      expect(mockExit).not.toHaveBeenCalled();
      
      mockExit.mockRestore();
    });

    test('should handle errors and exit', async () => {
      const testError = new Error('Command error');
      const testFn = jest.fn().mockRejectedValue(testError);
      const wrapped = errorReporter.createErrorBoundary(testFn, 'test-command');
      
      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      await wrapped('arg1');
      
      expect(mockExit).toHaveBeenCalledWith(1);
      
      const summary = errorReporter.getErrorSummary();
      expect(summary.totalErrors).toBe(1);
      
      mockExit.mockRestore();
    });

    test('should exit with code 126 for permission errors', async () => {
      const testError = new Error('Permission denied');
      testError.code = 'EACCES';
      const testFn = jest.fn().mockRejectedValue(testError);
      const wrapped = errorReporter.createErrorBoundary(testFn, 'test-command');
      
      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      await wrapped();
      
      expect(mockExit).toHaveBeenCalledWith(126);
      
      mockExit.mockRestore();
    });
  });

  describe('Dashboard Generation', () => {
    test('should generate dashboard content', async () => {
      // Add some test errors
      await errorReporter.report(new Error('Test error 1'), { command: 'test1' });
      await errorReporter.report(new Error('Test error 2'), { command: 'test2' });
      
      const dashboard = await errorReporter.generateDashboard();
      
      expect(dashboard).toContain('REST-SPEC Error Report Dashboard');
      expect(dashboard).toContain('Summary');
      expect(dashboard).toContain('Total Errors: 2');
      expect(dashboard).toContain('Error Categories');
    });
  });

  describe('Error File Management', () => {
    test('should handle missing error directory gracefully', async () => {
      // Disable error reporting to test graceful failure
      errorReporter.isEnabled = false;
      
      const error = new Error('Test error');
      const report = await errorReporter.report(error, { command: 'test' });
      
      // Should still generate report even if can't save
      expect(report).toBeDefined();
      expect(report.message).toBe('Test error');
    });

    test('should get recent errors', async () => {
      // This test would require mocking file system operations
      const recentErrors = await errorReporter.getRecentErrors();
      
      // Should return array (empty if no files)
      expect(Array.isArray(recentErrors)).toBe(true);
    });
  });
});