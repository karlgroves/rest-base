/**
 * Health Checker Unit Tests
 *
 * Tests for the comprehensive health checking system.
 *
 * @author Karl Groves
 */

const {
  HealthChecker,
  HealthStatus,
  DEFAULT_CONFIG,
} = require("../../shared/health-checker");

describe("HealthChecker", () => {
  let healthChecker;

  beforeEach(() => {
    healthChecker = new HealthChecker();
  });

  afterEach(() => {
    // Clean up any registered checks
    const checks = healthChecker.getCheckInfo();
    checks.forEach((check) => {
      if (!["system", "memory", "disk"].includes(check.name)) {
        healthChecker.unregisterCheck(check.name);
      }
    });
  });

  describe("Constructor", () => {
    it("should initialize with default configuration", () => {
      const checker = new HealthChecker();
      expect(checker.config).toMatchObject(DEFAULT_CONFIG);
    });

    it("should merge custom configuration with defaults", () => {
      const customConfig = {
        timeout: 10000,
        thresholds: {
          memory: { warning: 0.9 },
        },
      };

      const checker = new HealthChecker(customConfig);
      expect(checker.config.timeout).toBe(10000);
      expect(checker.config.thresholds.memory.warning).toBe(0.9);
      expect(checker.config.thresholds.memory.critical).toBe(
        DEFAULT_CONFIG.thresholds.memory.critical,
      );
    });

    it("should register default system checks", () => {
      const checker = new HealthChecker();
      const checkInfo = checker.getCheckInfo();
      const checkNames = checkInfo.map((c) => c.name);

      expect(checkNames).toContain("system");
      expect(checkNames).toContain("memory");
      expect(checkNames).toContain("disk");
    });
  });

  describe("Check Registration", () => {
    it("should register a new health check", () => {
      const checkFunction = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "Test check passed",
      });

      healthChecker.registerCheck("test-check", checkFunction);

      const checkInfo = healthChecker.getCheckInfo();
      const testCheck = checkInfo.find((c) => c.name === "test-check");

      expect(testCheck).toBeDefined();
      expect(testCheck.enabled).toBe(true);
      expect(testCheck.critical).toBe(false);
    });

    it("should register a check with custom options", () => {
      const checkFunction = jest.fn();
      const options = {
        timeout: 5000,
        retries: 3,
        critical: true,
        enabled: false,
      };

      healthChecker.registerCheck("custom-check", checkFunction, options);

      const checkInfo = healthChecker.getCheckInfo();
      const customCheck = checkInfo.find((c) => c.name === "custom-check");

      expect(customCheck.timeout).toBe(5000);
      expect(customCheck.retries).toBe(3);
      expect(customCheck.critical).toBe(true);
      expect(customCheck.enabled).toBe(false);
    });

    it("should unregister a health check", () => {
      const checkFunction = jest.fn();
      healthChecker.registerCheck("temp-check", checkFunction);

      let checkInfo = healthChecker.getCheckInfo();
      expect(checkInfo.find((c) => c.name === "temp-check")).toBeDefined();

      healthChecker.unregisterCheck("temp-check");

      checkInfo = healthChecker.getCheckInfo();
      expect(checkInfo.find((c) => c.name === "temp-check")).toBeUndefined();
    });
  });

  describe("runSingleCheck", () => {
    it("should successfully run a healthy check", async () => {
      const checkFunction = jest.fn().mockResolvedValue({
        status: HealthStatus.HEALTHY,
        message: "All good",
        data: { value: 42 },
      });

      const checkConfig = {
        name: "test-check",
        check: checkFunction,
        timeout: 5000,
        retries: 1,
      };

      const result = await healthChecker.runSingleCheck(checkConfig);

      expect(result.name).toBe("test-check");
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.message).toBe("All good");
      expect(result.data.value).toBe(42);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
      expect(result.attempt).toBe(1);
    });

    it("should handle check failures with retries", async () => {
      const checkFunction = jest
        .fn()
        .mockRejectedValueOnce(new Error("First attempt failed"))
        .mockRejectedValueOnce(new Error("Second attempt failed"))
        .mockResolvedValueOnce({
          status: HealthStatus.HEALTHY,
          message: "Third attempt succeeded",
        });

      const checkConfig = {
        name: "retry-check",
        check: checkFunction,
        timeout: 5000,
        retries: 2,
      };

      const result = await healthChecker.runSingleCheck(checkConfig);

      expect(checkFunction).toHaveBeenCalledTimes(3);
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.attempt).toBe(3);
    });

    it("should fail after exhausting retries", async () => {
      const checkFunction = jest
        .fn()
        .mockRejectedValue(new Error("Persistent failure"));

      const checkConfig = {
        name: "failing-check",
        check: checkFunction,
        timeout: 1000,
        retries: 2,
      };

      const result = await healthChecker.runSingleCheck(checkConfig);

      expect(checkFunction).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toBe("Persistent failure");
      expect(result.error).toContain("Persistent failure");
      expect(result.attempt).toBe(3);
    });

    it("should handle check timeout", async () => {
      const checkFunction = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 2000)),
        );

      const checkConfig = {
        name: "timeout-check",
        check: checkFunction,
        timeout: 100,
        retries: 0,
      };

      const result = await healthChecker.runSingleCheck(checkConfig);

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.message).toBe("Health check timeout");
      expect(result.duration).toBe(100);
    });
  });

  describe("checkHealth", () => {
    beforeEach(() => {
      // Clear default checks for these tests
      ["system", "memory", "disk"].forEach((name) => {
        healthChecker.unregisterCheck(name);
      });
    });

    it("should run all enabled checks", async () => {
      const check1 = jest
        .fn()
        .mockResolvedValue({ status: HealthStatus.HEALTHY });
      const check2 = jest
        .fn()
        .mockResolvedValue({ status: HealthStatus.HEALTHY });
      const check3 = jest
        .fn()
        .mockResolvedValue({ status: HealthStatus.HEALTHY });

      healthChecker.registerCheck("check1", check1);
      healthChecker.registerCheck("check2", check2);
      healthChecker.registerCheck("check3", check3, { enabled: false });

      const result = await healthChecker.checkHealth();

      expect(check1).toHaveBeenCalled();
      expect(check2).toHaveBeenCalled();
      expect(check3).not.toHaveBeenCalled();

      expect(Object.keys(result.checks)).toEqual(["check1", "check2"]);
      expect(result.summary.total).toBe(2);
    });

    it("should run only specific checks when requested", async () => {
      const check1 = jest
        .fn()
        .mockResolvedValue({ status: HealthStatus.HEALTHY });
      const check2 = jest
        .fn()
        .mockResolvedValue({ status: HealthStatus.HEALTHY });

      healthChecker.registerCheck("check1", check1);
      healthChecker.registerCheck("check2", check2);

      const result = await healthChecker.checkHealth(["check1"]);

      expect(check1).toHaveBeenCalled();
      expect(check2).not.toHaveBeenCalled();

      expect(Object.keys(result.checks)).toEqual(["check1"]);
    });

    it("should determine overall status correctly", async () => {
      healthChecker.registerCheck(
        "healthy",
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
        }),
      );
      healthChecker.registerCheck(
        "degraded",
        jest.fn().mockResolvedValue({
          status: HealthStatus.DEGRADED,
        }),
      );

      const result = await healthChecker.checkHealth();
      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.summary.healthy).toBe(1);
      expect(result.summary.degraded).toBe(1);
    });

    it("should mark system as critical when critical check fails", async () => {
      healthChecker.registerCheck(
        "critical-service",
        jest.fn().mockResolvedValue({
          status: HealthStatus.UNHEALTHY,
        }),
        { critical: true },
      );

      healthChecker.registerCheck(
        "optional-service",
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
        }),
      );

      const result = await healthChecker.checkHealth();
      expect(result.status).toBe(HealthStatus.CRITICAL);
    });

    it("should include uptime and summary information", async () => {
      const result = await healthChecker.checkHealth();

      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.uptime.milliseconds).toBeGreaterThanOrEqual(0);
      expect(result.uptime.readable).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBeDefined();
    });
  });

  describe("System Checks", () => {
    it("should check system health", async () => {
      const result = await healthChecker.checkHealth(["system"]);
      const systemCheck = result.checks.system;

      expect(systemCheck).toBeDefined();
      expect(systemCheck.status).toBeDefined();
      expect(systemCheck.data).toBeDefined();
      expect(systemCheck.data.cpu).toBeDefined();
      expect(systemCheck.data.uptime).toBeDefined();
      expect(systemCheck.data.platform).toBe(process.platform);
      expect(systemCheck.data.nodeVersion).toBe(process.version);
    });

    it("should check memory health", async () => {
      const result = await healthChecker.checkHealth(["memory"]);
      const memoryCheck = result.checks.memory;

      expect(memoryCheck).toBeDefined();
      expect(memoryCheck.status).toBeDefined();
      expect(memoryCheck.data).toBeDefined();
      expect(memoryCheck.data.heap).toBeDefined();
      expect(memoryCheck.data.system).toBeDefined();
      expect(memoryCheck.data.heap.used).toBeGreaterThan(0);
      expect(memoryCheck.data.heap.percent).toBeGreaterThanOrEqual(0);
    });

    it("should check disk health", async () => {
      const result = await healthChecker.checkHealth(["disk"]);
      const diskCheck = result.checks.disk;

      expect(diskCheck).toBeDefined();
      expect(diskCheck.status).toBeDefined();
      expect(diskCheck.data).toBeDefined();
      expect(diskCheck.data.path).toBe(process.cwd());
      expect(diskCheck.data.accessible).toBe(true);
    });
  });

  describe("Static Factory Methods", () => {
    describe("createDatabaseCheck", () => {
      it("should create a working database check for PostgreSQL", async () => {
        const mockDb = {
          query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
        };

        const dbCheck = HealthChecker.createDatabaseCheck(mockDb, "postgres");
        const result = await dbCheck();

        expect(mockDb.query).toHaveBeenCalledWith("SELECT 1");
        expect(result.status).toBe(HealthStatus.HEALTHY);
        expect(result.data.type).toBe("postgres");
        expect(result.data.connected).toBe(true);
      });

      it("should handle database connection failures", async () => {
        const mockDb = {
          query: jest.fn().mockRejectedValue(new Error("Connection failed")),
        };

        const dbCheck = HealthChecker.createDatabaseCheck(mockDb, "postgres");
        const result = await dbCheck();

        expect(result.status).toBe(HealthStatus.UNHEALTHY);
        expect(result.data.connected).toBe(false);
        expect(result.data.error).toBe("Connection failed");
      });
    });

    describe("createExternalServiceCheck", () => {
      // Note: These tests would need to mock fetch in a real environment
      it("should create an external service check", () => {
        const serviceCheck = HealthChecker.createExternalServiceCheck(
          "https://api.example.com/health",
        );
        expect(typeof serviceCheck).toBe("function");
      });
    });
  });

  describe("Utility Methods", () => {
    it("should format uptime correctly", () => {
      expect(healthChecker.formatUptime(1000)).toBe("1s");
      expect(healthChecker.formatUptime(65000)).toBe("1m 5s");
      expect(healthChecker.formatUptime(3665000)).toBe("1h 1m 5s");
      expect(healthChecker.formatUptime(90065000)).toBe("1d 1h 1m");
    });

    it("should get last results", async () => {
      healthChecker.registerCheck(
        "test",
        jest.fn().mockResolvedValue({
          status: HealthStatus.HEALTHY,
        }),
      );

      await healthChecker.checkHealth(["test"]);
      const lastResults = healthChecker.getLastResults();

      expect(lastResults.test).toBeDefined();
      expect(lastResults.test.status).toBe(HealthStatus.HEALTHY);
    });

    it("should get check information", () => {
      healthChecker.registerCheck("info-test", jest.fn(), {
        timeout: 3000,
        critical: true,
      });

      const checkInfo = healthChecker.getCheckInfo();
      const infoCheck = checkInfo.find((c) => c.name === "info-test");

      expect(infoCheck.timeout).toBe(3000);
      expect(infoCheck.critical).toBe(true);
    });
  });
});
