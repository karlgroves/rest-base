/**
 * Input Sanitization Utilities Type Definitions
 */

export interface SanitizationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
  warning?: string;
}

export interface UrlSanitizationResult extends SanitizationResult {
  isPrivate?: boolean;
}

/**
 * Validates and sanitizes project names
 * Prevents directory traversal and command injection
 */
export function sanitizeProjectName(name: string): SanitizationResult;

/**
 * Validates and sanitizes file paths
 * Prevents directory traversal attacks
 */
export function sanitizeFilePath(
  path: string,
  basePath?: string,
): SanitizationResult;

/**
 * Validates npm package names
 */
export function sanitizePackageName(packageName: string): SanitizationResult;

/**
 * Validates and sanitizes command-line arguments
 */
export function sanitizeCliArg(arg: string): SanitizationResult;

/**
 * Escapes shell arguments for safe execution
 */
export function escapeShellArg(arg: string): string;

/**
 * Validates URLs
 */
export function sanitizeUrl(url: string): UrlSanitizationResult;
