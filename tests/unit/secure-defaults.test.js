/**
 * Tests for Secure Defaults Configuration
 */

const {
  getSecureDefaults,
  validateConfiguration,
  expressDefaults,
  databaseDefaults,
  loggingDefaults,
  authDefaults,
  fileDefaults,
  apiDefaults,
} = require("../../shared/secure-defaults");

describe("Secure Defaults", () => {
  describe("getSecureDefaults", () => {
    it("should return express defaults", () => {
      const config = getSecureDefaults("express");

      expect(config).toHaveProperty("helmet");
      expect(config).toHaveProperty("cors");
      expect(config).toHaveProperty("rateLimit");
      expect(config).toHaveProperty("session");
      expect(config).toHaveProperty("bodyParser");

      // Check security defaults
      expect(config.cors.origin).toBe(false);
      expect(config.session.cookie.secure).toBe(true);
      expect(config.session.cookie.httpOnly).toBe(true);
      expect(config.session.cookie.sameSite).toBe("strict");
    });

    it("should return database defaults", () => {
      const config = getSecureDefaults("database");

      expect(config).toHaveProperty("mysql");
      expect(config).toHaveProperty("sequelize");

      // Check security defaults
      expect(config.mysql.ssl.rejectUnauthorized).toBe(true);
      expect(config.sequelize.dialectOptions.ssl.require).toBe(true);
      expect(config.sequelize.dialectOptions.ssl.rejectUnauthorized).toBe(true);
    });

    it("should return logging defaults", () => {
      const config = getSecureDefaults("logging");

      expect(config).toHaveProperty("winston");
      expect(config.winston).toHaveProperty("level");
      expect(config.winston).toHaveProperty("transports");
      expect(Array.isArray(config.winston.transports)).toBe(true);
    });

    it("should return auth defaults", () => {
      const config = getSecureDefaults("auth");

      expect(config).toHaveProperty("jwt");
      expect(config).toHaveProperty("bcrypt");
      expect(config).toHaveProperty("password");

      // Check security defaults
      expect(config.bcrypt.rounds).toBeGreaterThanOrEqual(12);
      expect(config.password.minLength).toBeGreaterThanOrEqual(8);
      expect(config.password.requireUppercase).toBe(true);
      expect(config.password.requireLowercase).toBe(true);
      expect(config.password.requireNumbers).toBe(true);
      expect(config.password.requireSpecialChars).toBe(true);
    });

    it("should return file defaults", () => {
      const config = getSecureDefaults("file");

      expect(config).toHaveProperty("upload");
      expect(config).toHaveProperty("paths");

      // Check security defaults
      expect(config.upload.maxFileSize).toBeDefined();
      expect(Array.isArray(config.upload.allowedMimeTypes)).toBe(true);
      expect(Array.isArray(config.paths.allowedDirectories)).toBe(true);
      expect(Array.isArray(config.paths.forbiddenDirectories)).toBe(true);
    });

    it("should return api defaults", () => {
      const config = getSecureDefaults("api");

      expect(config).toHaveProperty("response");
      expect(config).toHaveProperty("validation");

      // Check security defaults
      expect(config.response.defaultHeaders).toHaveProperty(
        "X-Content-Type-Options",
      );
      expect(config.response.defaultHeaders).toHaveProperty("X-Frame-Options");
      expect(config.response.defaultHeaders).toHaveProperty("X-XSS-Protection");
      expect(config.validation.stripUnknown).toBe(true);
    });

    it("should apply environment-specific overrides", () => {
      const devConfig = getSecureDefaults("logging", "development");
      const prodConfig = getSecureDefaults("logging", "production");

      expect(devConfig.winston.level).toBe("debug");
      expect(prodConfig.winston.level).toBe("info");
    });
  });

  describe("validateConfiguration", () => {
    it("should validate express configuration", () => {
      const validConfig = {
        helmet: { contentSecurityPolicy: {} },
        rateLimit: { windowMs: 15000 },
        cors: { origin: "https://example.com" },
      };

      const result = validateConfiguration(validConfig, "express");
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should detect missing express security configuration", () => {
      const invalidConfig = {
        cors: { origin: "https://example.com" },
        // Missing helmet and rateLimit
      };

      const result = validateConfiguration(invalidConfig, "express");
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        "Missing Helmet security middleware configuration",
      );
      expect(result.issues).toContain("Missing rate limiting configuration");
    });

    it("should validate database configuration", () => {
      const validConfig = {
        ssl: { rejectUnauthorized: true },
        host: "localhost",
      };

      const result = validateConfiguration(validConfig, "database");
      expect(result.isValid).toBe(true);
    });

    it("should detect missing database SSL configuration", () => {
      const invalidConfig = {
        host: "localhost",
        // Missing SSL configuration
      };

      const result = validateConfiguration(invalidConfig, "database");
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        "SSL not configured for database connection",
      );
    });

    it("should validate auth configuration", () => {
      const validConfig = {
        jwt: { secret: "my-secret-key" },
      };

      const result = validateConfiguration(validConfig, "auth");
      expect(result.isValid).toBe(true);
    });

    it("should detect missing JWT secret", () => {
      const invalidConfig = {
        jwt: {},
        // Missing secret
      };

      const result = validateConfiguration(invalidConfig, "auth");
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("JWT secret not configured");
    });
  });

  describe("Default exports", () => {
    it("should export all default configurations", () => {
      expect(expressDefaults).toBeDefined();
      expect(databaseDefaults).toBeDefined();
      expect(loggingDefaults).toBeDefined();
      expect(authDefaults).toBeDefined();
      expect(fileDefaults).toBeDefined();
      expect(apiDefaults).toBeDefined();
    });

    it("should have secure express defaults", () => {
      expect(expressDefaults.helmet).toBeDefined();
      expect(expressDefaults.rateLimit.max).toBeLessThanOrEqual(1000);
      expect(expressDefaults.session.cookie.secure).toBe(true);
    });

    it("should have secure database defaults", () => {
      expect(databaseDefaults.mysql.ssl.rejectUnauthorized).toBe(true);
      expect(databaseDefaults.sequelize.define.paranoid).toBe(true);
    });

    it("should have secure auth defaults", () => {
      expect(authDefaults.bcrypt.rounds).toBeGreaterThanOrEqual(10);
      expect(authDefaults.jwt.algorithm).toBe("HS256");
    });

    it("should have secure file defaults", () => {
      expect(fileDefaults.upload.maxFileSize).toBeLessThanOrEqual(
        50 * 1024 * 1024,
      );
      expect(fileDefaults.paths.forbiddenDirectories).toContain(
        "./node_modules/",
      );
      expect(fileDefaults.paths.forbiddenDirectories).toContain("./.git/");
    });

    it("should have secure API defaults", () => {
      expect(apiDefaults.response.defaultHeaders["X-Frame-Options"]).toBe(
        "DENY",
      );
      expect(
        apiDefaults.response.defaultHeaders["X-Content-Type-Options"],
      ).toBe("nosniff");
      expect(apiDefaults.validation.stripUnknown).toBe(true);
    });
  });

  describe("Environment handling", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should use development defaults when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      const config = getSecureDefaults("logging");
      expect(config.winston.level).toBe("debug");
    });

    it("should use production defaults when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      const config = getSecureDefaults("logging");
      expect(config.winston.level).toBe("info");
    });

    it("should default to development when NODE_ENV is not set", () => {
      delete process.env.NODE_ENV;
      const config = getSecureDefaults("logging");
      expect(config.winston.level).toBe("debug");
    });
  });
});
