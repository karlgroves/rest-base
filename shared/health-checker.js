/**
 * Health Check System
 *
 * Comprehensive health checking system for REST APIs that monitors
 * application health, dependencies, and system resources.
 *
 * @author Karl Groves
 */

const os = require("os");
const fs = require("fs").promises;
const { performance } = require("perf_hooks");

/**
 * Health check status levels
 */
const HealthStatus = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
  CRITICAL: "critical",
};

/**
 * Default health check configuration
 */
const DEFAULT_CONFIG = {
  timeout: 5000,
  retries: 2,
  thresholds: {
    memory: {
      warning: 0.8, // 80% memory usage
      critical: 0.95, // 95% memory usage
    },
    cpu: {
      warning: 0.7, // 70% CPU usage
      critical: 0.9, // 90% CPU usage
    },
    disk: {
      warning: 0.8, // 80% disk usage
      critical: 0.95, // 95% disk usage
    },
    responseTime: {
      warning: 1000, // 1 second
      critical: 5000, // 5 seconds
    },
  },
  checks: {
    database: true,
    redis: true,
    external: true,
    filesystem: true,
  },
};

/**
 * Health checker class
 */
class HealthChecker {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.checks = new Map();
    this.lastResults = new Map();
    this.startTime = Date.now();

    // Register default system checks
    this.registerCheck("system", this.checkSystem.bind(this));
    this.registerCheck("memory", this.checkMemory.bind(this));
    this.registerCheck("disk", this.checkDisk.bind(this));
  }

  /**
   * Registers a health check
   * @param {string} name - Check name
   * @param {Function} checkFunction - Function that performs the check
   * @param {Object} options - Check options
   */
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      check: checkFunction,
      timeout: options.timeout || this.config.timeout,
      retries: options.retries || this.config.retries,
      critical: options.critical || false,
      enabled: options.enabled !== false,
    });
  }

  /**
   * Removes a health check
   * @param {string} name - Check name
   */
  unregisterCheck(name) {
    this.checks.delete(name);
    this.lastResults.delete(name);
  }

  /**
   * Runs a single health check with timeout and retries
   * @param {Object} checkConfig - Check configuration
   * @returns {Object} Check result
   */
  async runSingleCheck(checkConfig) {
    const { name, check, timeout, retries } = checkConfig;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = performance.now();

        // Run check with timeout
        const result = await Promise.race([
          check(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Health check timeout")),
              timeout,
            ),
          ),
        ]);

        const duration = performance.now() - startTime;

        return {
          name,
          status: result.status || HealthStatus.HEALTHY,
          message: result.message || "OK",
          data: result.data || {},
          duration: Math.round(duration),
          timestamp: new Date().toISOString(),
          attempt: attempt + 1,
        };
      } catch (error) {
        lastError = error;

        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 100),
          );
        }
      }
    }

    return {
      name,
      status: HealthStatus.UNHEALTHY,
      message: lastError.message || "Health check failed",
      error: lastError.toString(),
      duration: timeout,
      timestamp: new Date().toISOString(),
      attempt: retries + 1,
    };
  }

  /**
   * Runs all registered health checks
   * @param {Array} specificChecks - Run only specific checks (optional)
   * @returns {Object} Complete health report
   */
  async checkHealth(specificChecks = null) {
    const checksToRun = specificChecks
      ? Array.from(this.checks.values()).filter((check) =>
          specificChecks.includes(check.name),
        )
      : Array.from(this.checks.values()).filter((check) => check.enabled);

    const results = await Promise.all(
      checksToRun.map((check) => this.runSingleCheck(check)),
    );

    // Store results for history
    results.forEach((result) => {
      this.lastResults.set(result.name, result);
    });

    // Determine overall status
    const overallStatus = this.determineOverallStatus(results);

    // Calculate uptime
    const uptime = Date.now() - this.startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        readable: this.formatUptime(uptime),
      },
      checks: results.reduce((acc, result) => {
        acc[result.name] = result;
        return acc;
      }, {}),
      summary: {
        total: results.length,
        healthy: results.filter((r) => r.status === HealthStatus.HEALTHY)
          .length,
        degraded: results.filter((r) => r.status === HealthStatus.DEGRADED)
          .length,
        unhealthy: results.filter((r) => r.status === HealthStatus.UNHEALTHY)
          .length,
        critical: results.filter((r) => r.status === HealthStatus.CRITICAL)
          .length,
      },
    };
  }

  /**
   * Determines overall system status based on individual check results
   * @param {Array} results - Array of check results
   * @returns {string} Overall status
   */
  determineOverallStatus(results) {
    const criticalChecks = Array.from(this.checks.values()).filter(
      (c) => c.critical,
    );
    const criticalResults = results.filter((r) =>
      criticalChecks.some((c) => c.name === r.name),
    );

    // If any critical check fails, system is critical
    if (
      criticalResults.some(
        (r) =>
          r.status === HealthStatus.CRITICAL ||
          r.status === HealthStatus.UNHEALTHY,
      )
    ) {
      return HealthStatus.CRITICAL;
    }

    // Check for any unhealthy services
    if (results.some((r) => r.status === HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }

    // Check for degraded services
    if (results.some((r) => r.status === HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  /**
   * Formats uptime in human readable format
   * @param {number} milliseconds - Uptime in milliseconds
   * @returns {string} Formatted uptime
   */
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * System health check
   * @returns {Object} System health status
   */
  async checkSystem() {
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Calculate CPU percentage (simplified)
    const cpuPercent =
      (cpuUsage.user + cpuUsage.system) / (uptime * 1000 * 1000);

    let status = HealthStatus.HEALTHY;
    let message = "System operating normally";

    if (cpuPercent > this.config.thresholds.cpu.critical) {
      status = HealthStatus.CRITICAL;
      message = "Critical CPU usage detected";
    } else if (cpuPercent > this.config.thresholds.cpu.warning) {
      status = HealthStatus.DEGRADED;
      message = "High CPU usage detected";
    }

    return {
      status,
      message,
      data: {
        cpu: {
          usage: cpuPercent,
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: {
          process: uptime,
          system: os.uptime(),
        },
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
    };
  }

  /**
   * Memory health check
   * @returns {Object} Memory health status
   */
  async checkMemory() {
    const memUsage = process.memoryUsage();
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem(),
    };

    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
    const systemUsedPercent =
      (systemMem.total - systemMem.free) / systemMem.total;

    let status = HealthStatus.HEALTHY;
    let message = "Memory usage normal";

    if (
      heapUsedPercent > this.config.thresholds.memory.critical ||
      systemUsedPercent > this.config.thresholds.memory.critical
    ) {
      status = HealthStatus.CRITICAL;
      message = "Critical memory usage";
    } else if (
      heapUsedPercent > this.config.thresholds.memory.warning ||
      systemUsedPercent > this.config.thresholds.memory.warning
    ) {
      status = HealthStatus.DEGRADED;
      message = "High memory usage";
    }

    return {
      status,
      message,
      data: {
        heap: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percent: heapUsedPercent * 100,
        },
        system: {
          total: systemMem.total,
          free: systemMem.free,
          used: systemMem.total - systemMem.free,
          percent: systemUsedPercent * 100,
        },
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
    };
  }

  /**
   * Disk space health check
   * @returns {Object} Disk health status
   */
  async checkDisk() {
    try {
      await fs.stat(process.cwd());

      // This is a simplified check - in production you'd want to check actual disk usage
      // using a library like 'statvfs' or platform-specific commands

      return {
        status: HealthStatus.HEALTHY,
        message: "Disk space available",
        data: {
          path: process.cwd(),
          accessible: true,
          lastCheck: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: "Cannot access filesystem",
        data: {
          error: error.message,
          path: process.cwd(),
        },
      };
    }
  }

  /**
   * Database health check factory
   * @param {Object} database - Database connection object (Sequelize instance or MySQL connection)
   * @param {string} type - Database type (mysql, mariadb, redis)
   * @returns {Function} Database health check function
   */
  static createDatabaseCheck(database, type = "mysql") {
    return async () => {
      try {
        const startTime = performance.now();

        // Different checks based on database type
        switch (type.toLowerCase()) {
          case "mysql":
          case "mariadb":
            // For Sequelize ORM
            if (database.authenticate) {
              await database.authenticate();
            }
            // For raw MySQL connection
            else if (database.execute) {
              await database.execute("SELECT 1");
            }
            // For mysql2 promise connection
            else if (database.query) {
              await database.query("SELECT 1");
            }
            break;
          case "redis":
            await database.ping();
            break;
          default:
            throw new Error(`Unsupported database type: ${type}. Use 'mysql', 'mariadb', or 'redis'`);
        }

        const duration = performance.now() - startTime;

        return {
          status: HealthStatus.HEALTHY,
          message: `${type} database connection healthy`,
          data: {
            type,
            responseTime: Math.round(duration),
            connected: true,
          },
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: `${type} database connection failed`,
          data: {
            type,
            error: error.message,
            connected: false,
          },
        };
      }
    };
  }

  /**
   * External service health check factory
   * @param {string} url - Service URL to check
   * @param {Object} options - Request options
   * @returns {Function} External service health check function
   */
  static createExternalServiceCheck(url, options = {}) {
    return async () => {
      try {
        const startTime = performance.now();

        // Use fetch or http module to check external service
        const response = await fetch(url, {
          method: options.method || "GET",
          timeout: options.timeout || 5000,
          headers: options.headers || {},
        });

        const duration = performance.now() - startTime;

        let status = HealthStatus.HEALTHY;
        let message = "External service accessible";

        if (!response.ok) {
          status =
            response.status >= 500
              ? HealthStatus.UNHEALTHY
              : HealthStatus.DEGRADED;
          message = `External service returned ${response.status}`;
        }

        return {
          status,
          message,
          data: {
            url,
            statusCode: response.status,
            responseTime: Math.round(duration),
            headers: Object.fromEntries(response.headers.entries()),
          },
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: "External service unreachable",
          data: {
            url,
            error: error.message,
          },
        };
      }
    };
  }

  /**
   * Gets the last known results for all checks
   * @returns {Object} Last results
   */
  getLastResults() {
    return Object.fromEntries(this.lastResults);
  }

  /**
   * Gets detailed information about registered checks
   * @returns {Array} Check information
   */
  getCheckInfo() {
    return Array.from(this.checks.values()).map((check) => ({
      name: check.name,
      enabled: check.enabled,
      critical: check.critical,
      timeout: check.timeout,
      retries: check.retries,
    }));
  }
}

module.exports = {
  HealthChecker,
  HealthStatus,
  DEFAULT_CONFIG,
};
