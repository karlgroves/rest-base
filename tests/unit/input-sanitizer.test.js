/**
 * Tests for Input Sanitization Utilities
 */

const {
  sanitizeProjectName,
  sanitizeFilePath,
  sanitizePackageName,
  sanitizeCliArg,
  escapeShellArg,
  sanitizeUrl,
} = require("../../shared/input-sanitizer");

describe("Input Sanitizer", () => {
  describe("sanitizeProjectName", () => {
    it("should accept valid project names", () => {
      const validNames = [
        "my-project",
        "MyProject",
        "project123",
        "project_name",
        "a",
        "project-with-dashes",
      ];

      validNames.forEach((name) => {
        const result = sanitizeProjectName(name);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(name);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject invalid project names", () => {
      const invalidNames = [
        "",
        "   ",
        null,
        undefined,
        123,
        "node_modules",
        ".git",
        "test",
        ".hidden",
        "../parent",
        "project/name",
        "project\\name",
        "project:name",
        "project|name",
        "project;name",
        "project&name",
        "project$name",
        "project`name",
        "a".repeat(215), // Too long
      ];

      invalidNames.forEach((name) => {
        const result = sanitizeProjectName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it("should trim whitespace", () => {
      const result = sanitizeProjectName("  my-project  ");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("my-project");
    });
  });

  describe("sanitizeFilePath", () => {
    it("should accept valid file paths", () => {
      const basePath = "/tmp/test";
      const validPaths = [
        "file.txt",
        "subfolder/file.txt",
        "./current/file.txt",
      ];

      validPaths.forEach((path) => {
        const result = sanitizeFilePath(path, basePath);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toContain(basePath);
      });
    });

    it("should reject path traversal attempts", () => {
      const basePath = "/tmp/test";
      const invalidPaths = [
        "../../../etc/passwd",
        "..\\..\\windows\\system32",
        "/etc/passwd",
        "file\0.txt",
      ];

      invalidPaths.forEach((path) => {
        const result = sanitizeFilePath(path, basePath);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe("sanitizePackageName", () => {
    it("should accept valid package names", () => {
      const validNames = [
        "lodash",
        "express",
        "@babel/core",
        "@types/node",
        "my-package",
        "package.js",
      ];

      validNames.forEach((name) => {
        const result = sanitizePackageName(name);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(name);
      });
    });

    it("should reject invalid package names", () => {
      const invalidNames = [
        "",
        "UPPERCASE",
        "package name",
        "package;name",
        "package|name",
        "package`name",
        "../malicious",
      ];

      invalidNames.forEach((name) => {
        const result = sanitizePackageName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe("sanitizeCliArg", () => {
    it("should sanitize dangerous characters", () => {
      const result = sanitizeCliArg("arg;rm -rf /");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("argrm -rf /");
      expect(result.warning).toBeDefined();
    });

    it("should leave safe arguments unchanged", () => {
      const result = sanitizeCliArg("safe-argument");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("safe-argument");
      expect(result.warning).toBeUndefined();
    });
  });

  describe("escapeShellArg", () => {
    it("should escape shell arguments", () => {
      const dangerous = "'; rm -rf /";
      const escaped = escapeShellArg(dangerous);

      if (process.platform === "win32") {
        expect(escaped).toBe('"\'; rm -rf /"');
      } else {
        expect(escaped).toBe("'\\'; rm -rf /'");
      }
    });

    it("should throw on non-string input", () => {
      expect(() => escapeShellArg(123)).toThrow(TypeError);
      expect(() => escapeShellArg(null)).toThrow(TypeError);
    });
  });

  describe("sanitizeUrl", () => {
    it("should accept valid URLs", () => {
      const validUrls = [
        "https://example.com",
        "http://example.com/path",
        "https://api.example.com:8080/v1/users",
      ];

      validUrls.forEach((url) => {
        const result = sanitizeUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBeDefined();
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = [
        "",
        "not-a-url",
        "javascript:alert(1)",
        "file:///etc/passwd",
        "ftp://example.com",
      ];

      invalidUrls.forEach((url) => {
        const result = sanitizeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it("should identify private URLs", () => {
      const privateUrls = [
        "http://localhost:3000",
        "https://127.0.0.1",
        "http://192.168.1.1",
        "https://10.0.0.1",
      ];

      privateUrls.forEach((url) => {
        const result = sanitizeUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.isPrivate).toBe(true);
      });
    });
  });
});
