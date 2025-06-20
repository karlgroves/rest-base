/**
 * Input Sanitization Utilities
 *
 * Provides secure input validation and sanitization functions
 * to prevent injection attacks and ensure data integrity.
 *
 * @module input-sanitizer
 * @author REST-Base Team
 */

/**
 * Validates and sanitizes project names
 * Prevents directory traversal and command injection
 *
 * @param {string} name - Project name to validate
 * @returns {object} { isValid: boolean, sanitized: string, error?: string }
 */
function sanitizeProjectName(name) {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Project name must be a non-empty string" };
  }

  // Remove leading/trailing whitespace
  const trimmed = name.trim();

  // Check for empty string after trimming
  if (!trimmed) {
    return { isValid: false, error: "Project name cannot be empty" };
  }

  // Reserved names that shouldn't be used
  const reserved = [
    "node_modules",
    ".git",
    "test",
    "tests",
    "__tests__",
    "coverage",
  ];
  if (reserved.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: `"${trimmed}" is a reserved name` };
  }

  // Dangerous characters and patterns
  const dangerous = /[<>:"|?*\\]/; // Windows forbidden chars
  const pathTraversal = /\.\./; // Prevent directory traversal
  const hiddenFile = /^\./; // Prevent hidden files
  const commandChars = /[;&|`$(){}[\]]/; // Shell command chars

  if (dangerous.test(trimmed)) {
    return {
      isValid: false,
      error: "Project name contains invalid characters",
    };
  }

  if (pathTraversal.test(trimmed)) {
    return { isValid: false, error: 'Project name cannot contain ".."' };
  }

  if (hiddenFile.test(trimmed)) {
    return { isValid: false, error: 'Project name cannot start with "."' };
  }

  if (commandChars.test(trimmed)) {
    return {
      isValid: false,
      error: "Project name contains shell command characters",
    };
  }

  // Valid project name pattern
  const validPattern = /^[a-zA-Z0-9-_]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      isValid: false,
      error:
        "Project name can only contain letters, numbers, hyphens, and underscores",
    };
  }

  // Length restrictions
  if (trimmed.length > 214) {
    // npm package name limit
    return {
      isValid: false,
      error: "Project name is too long (max 214 characters)",
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates and sanitizes file paths
 * Prevents directory traversal attacks
 *
 * @param {string} path - File path to validate
 * @param {string} basePath - Base directory to restrict access to
 * @returns {object} { isValid: boolean, sanitized: string, error?: string }
 */
function sanitizeFilePath(path, basePath = process.cwd()) {
  if (!path || typeof path !== "string") {
    return { isValid: false, error: "Path must be a non-empty string" };
  }

  const pathModule = require("path");

  // Resolve to absolute path
  const resolved = pathModule.resolve(basePath, path);

  // Ensure the resolved path is within the base directory
  if (!resolved.startsWith(pathModule.resolve(basePath))) {
    return { isValid: false, error: "Path traversal detected" };
  }

  // Check for null bytes
  if (path.includes("\0")) {
    return { isValid: false, error: "Path contains null bytes" };
  }

  return { isValid: true, sanitized: resolved };
}

/**
 * Validates npm package names
 *
 * @param {string} packageName - Package name to validate
 * @returns {object} { isValid: boolean, sanitized: string, error?: string }
 */
function sanitizePackageName(packageName) {
  if (!packageName || typeof packageName !== "string") {
    return { isValid: false, error: "Package name must be a non-empty string" };
  }

  const trimmed = packageName.trim();

  // npm package name rules
  const validPackageNameRegex =
    /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

  if (!validPackageNameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Invalid npm package name format",
    };
  }

  // Check for command injection characters
  const dangerousChars = /[;&|`$(){}[\]<>"'\\]/;
  if (dangerousChars.test(trimmed)) {
    return {
      isValid: false,
      error: "Package name contains dangerous characters",
    };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates and sanitizes command-line arguments
 *
 * @param {string} arg - Command-line argument to validate
 * @returns {object} { isValid: boolean, sanitized: string, error?: string }
 */
function sanitizeCliArg(arg) {
  if (typeof arg !== "string") {
    return { isValid: false, error: "Argument must be a string" };
  }

  // Remove any shell metacharacters
  const dangerous = /[;&|`$(){}[\]<>"'\\]/g;
  const sanitized = arg.replace(dangerous, "");

  if (sanitized !== arg) {
    return {
      isValid: true,
      sanitized,
      warning: "Dangerous characters were removed from the argument",
    };
  }

  return { isValid: true, sanitized: arg };
}

/**
 * Escapes shell arguments for safe execution
 *
 * @param {string} arg - Argument to escape
 * @returns {string} Escaped argument
 */
function escapeShellArg(arg) {
  if (typeof arg !== "string") {
    throw new TypeError("Argument must be a string");
  }

  // For Windows
  if (process.platform === "win32") {
    return '"' + arg.replace(/"/g, '""') + '"';
  }

  // For Unix-like systems
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

/**
 * Validates URLs
 *
 * @param {string} url - URL to validate
 * @returns {object} { isValid: boolean, sanitized: string, error?: string }
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "URL must be a non-empty string" };
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: "Only HTTP and HTTPS protocols are allowed",
      };
    }

    // Check for localhost/private IPs (optional, depends on requirements)
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
    ];

    const isPrivate = privatePatterns.some((pattern) => {
      if (typeof pattern === "string") {
        return hostname === pattern;
      }
      return pattern.test(hostname);
    });

    return {
      isValid: true,
      sanitized: parsed.toString(),
      isPrivate,
    };
  } catch (e) {
    return { isValid: false, error: "Invalid URL format" };
  }
}

module.exports = {
  sanitizeProjectName,
  sanitizeFilePath,
  sanitizePackageName,
  sanitizeCliArg,
  escapeShellArg,
  sanitizeUrl,
};
