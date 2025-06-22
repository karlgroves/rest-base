/**
 * CLI Tool Performance Benchmarks
 *
 * Performance benchmarks for REST-SPEC CLI tools including
 * project creation, configuration loading, and utility functions.
 *
 * @author Karl Groves
 */

const { suite } = require("./benchmark-runner");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// Import modules to benchmark
const { loadConfig } = require("../shared/config-loader");
const {
  validateAndSanitizeInput,
  validateApiResponse,
} = require("../shared/input-sanitizer");
const { generateSecureDefaults } = require("../shared/secure-defaults");
const { ErrorReporter } = require("../shared/error-reporter");

// Create test directory for benchmarks
const TEST_DIR = path.join(os.tmpdir(), "rest-spec-benchmark-" + Date.now());

/**
 * Configuration loading benchmarks
 */
const configBenchmarks = suite("Configuration Loading", {
  warmupRuns: 5,
  iterations: 100,
  output: {
    file: "benchmarks/results/config-loading.json",
  },
})
  .beforeAll(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });

    // Create sample config file
    const configPath = path.join(TEST_DIR, "rest-spec.config.js");
    await fs.writeFile(
      configPath,
      `
      module.exports = {
        projectName: 'benchmark-test',
        apiVersion: '1.0.0',
        server: {
          port: 3000,
          host: 'localhost'
        },
        database: {
          host: 'localhost',
          port: 5432,
          name: 'test_db'
        },
        features: {
          authentication: true,
          rateLimit: true,
          cors: true
        }
      };
    `,
    );
  })
  .add("Load Configuration File", async () => {
    const config = await loadConfig(TEST_DIR);
    // Ensure config is loaded
    if (!config.projectName) {
      throw new Error("Config not loaded properly");
    }
  })
  .add("Load Configuration with Cache", async () => {
    // First load to populate cache
    await loadConfig(TEST_DIR);
    // Second load should use cache
    const config = await loadConfig(TEST_DIR);
    if (!config.projectName) {
      throw new Error("Config not loaded properly");
    }
  })
  .add("Load Non-Existent Configuration", async () => {
    const nonExistentDir = path.join(TEST_DIR, "non-existent");
    const config = await loadConfig(nonExistentDir);
    // Should return empty object
    if (Object.keys(config).length !== 0) {
      throw new Error("Expected empty config");
    }
  })
  .afterAll(async () => {
    // Cleanup
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

/**
 * Input validation benchmarks
 */
const validationBenchmarks = suite("Input Validation", {
  warmupRuns: 3,
  iterations: 1000,
  output: {
    file: "benchmarks/results/validation.json",
  },
})
  .add("Validate Simple Input", () => {
    const input = {
      username: "testuser",
      email: "test@example.com",
      age: 25,
    };
    const schema = {
      username: { type: "string", required: true, minLength: 3 },
      email: { type: "email", required: true },
      age: { type: "number", min: 0, max: 150 },
    };
    const result = validateAndSanitizeInput(input, schema);
    if (!result.isValid) {
      throw new Error("Validation failed");
    }
  })
  .add("Validate Complex Nested Input", () => {
    const input = {
      user: {
        name: "John Doe",
        profile: {
          bio: "Software developer",
          skills: ["JavaScript", "Node.js", "REST APIs"],
          experience: 5,
        },
      },
      settings: {
        notifications: true,
        theme: "dark",
      },
    };
    const schema = {
      user: {
        type: "object",
        properties: {
          name: { type: "string", required: true },
          profile: {
            type: "object",
            properties: {
              bio: { type: "string", maxLength: 500 },
              skills: { type: "array", items: { type: "string" } },
              experience: { type: "number", min: 0 },
            },
          },
        },
      },
      settings: {
        type: "object",
        properties: {
          notifications: { type: "boolean" },
          theme: { type: "string", enum: ["light", "dark"] },
        },
      },
    };
    const result = validateAndSanitizeInput(input, schema);
    if (!result.isValid) {
      throw new Error("Validation failed");
    }
  })
  .add("Sanitize HTML Input", () => {
    const input = {
      title: 'Test <script>alert("xss")</script> Title',
      content:
        "Some content with <b>bold</b> and <script>malicious</script> code",
      tags: ["<tag1>", "tag2", "<script>tag3</script>"],
    };
    const schema = {
      title: { type: "string", sanitize: true },
      content: { type: "string", sanitize: true },
      tags: { type: "array", items: { type: "string", sanitize: true } },
    };
    const result = validateAndSanitizeInput(input, schema);
    if (!result.isValid || result.data.title.includes("<script>")) {
      throw new Error("Sanitization failed");
    }
  })
  .add("Validate API Response", () => {
    const response = {
      status: "success",
      data: {
        users: [
          { id: 1, name: "User 1", email: "user1@example.com" },
          { id: 2, name: "User 2", email: "user2@example.com" },
        ],
        total: 2,
        page: 1,
        perPage: 10,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
    const isValid = validateApiResponse(response);
    if (!isValid) {
      throw new Error("API response validation failed");
    }
  });

/**
 * Security defaults generation benchmarks
 */
const securityBenchmarks = suite("Security Defaults", {
  warmupRuns: 3,
  iterations: 50,
  output: {
    file: "benchmarks/results/security.json",
  },
})
  .add("Generate Basic Security Defaults", () => {
    const defaults = generateSecureDefaults({
      projectName: "benchmark-test",
      features: {
        authentication: true,
        rateLimit: true,
      },
    });
    if (!defaults.helmet || !defaults.cors) {
      throw new Error("Security defaults incomplete");
    }
  })
  .add("Generate Complex Security Configuration", () => {
    const defaults = generateSecureDefaults({
      projectName: "benchmark-test",
      environment: "production",
      features: {
        authentication: true,
        rateLimit: true,
        cors: true,
        csrf: true,
        contentSecurity: true,
      },
      customDomains: ["api.example.com", "app.example.com"],
      database: {
        type: "postgresql",
        ssl: true,
      },
    });
    if (!defaults.helmet || !defaults.cors || !defaults.rateLimit) {
      throw new Error("Security defaults incomplete");
    }
  });

/**
 * Error reporting benchmarks
 */
const errorBenchmarks = suite("Error Reporting", {
  warmupRuns: 3,
  iterations: 100,
  output: {
    file: "benchmarks/results/error-reporting.json",
  },
})
  .beforeAll(() => {
    // Initialize error reporter
    ErrorReporter.configure({
      enableTelemetry: false,
      storageDir: TEST_DIR,
    });
  })
  .add("Report Simple Error", async () => {
    const error = new Error("Test error");
    await ErrorReporter.report(error, {
      context: "benchmark-test",
      userId: "test-user",
    });
  })
  .add("Report Complex Error with Stack", async () => {
    const error = new Error("Complex error with deep stack");
    error.code = "ERR_COMPLEX";
    error.statusCode = 500;
    error.details = {
      module: "benchmark",
      operation: "test",
      timestamp: new Date().toISOString(),
      metadata: {
        key1: "value1",
        key2: "value2",
        nested: {
          deep: {
            value: "nested-value",
          },
        },
      },
    };
    await ErrorReporter.report(error, {
      context: "benchmark-test",
      userId: "test-user",
      requestId: "req-123",
      sessionId: "session-456",
    });
  })
  .add("Batch Error Reporting", async () => {
    const errors = [];
    for (let i = 0; i < 10; i++) {
      errors.push(new Error(`Batch error ${i}`));
    }

    await Promise.all(
      errors.map((error, index) =>
        ErrorReporter.report(error, {
          context: "batch-test",
          batchId: "batch-123",
          index,
        }),
      ),
    );
  })
  .afterAll(async () => {
    // Cleanup
    await fs.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
  });

/**
 * CLI utility benchmarks
 */
const utilityBenchmarks = suite("CLI Utilities", {
  warmupRuns: 3,
  iterations: 1000,
  output: {
    file: "benchmarks/results/utilities.json",
  },
})
  .add("Format Status Messages", () => {
    const { formatStatus } = require("../shared/cli-utils");

    // Test various status formatting
    const statuses = ["success", "error", "warning", "info"];
    const messages = [
      "Operation completed successfully",
      "An error occurred during processing",
      "Warning: This action cannot be undone",
      "Information: New version available",
    ];

    for (let i = 0; i < statuses.length; i++) {
      const formatted = formatStatus(statuses[i], messages[i]);
      if (!formatted) {
        throw new Error("Status formatting failed");
      }
    }
  })
  .add("Create and Update Spinners", async () => {
    const { createSpinner } = require("../shared/cli-utils");

    const spinner = createSpinner("Processing...");
    spinner.start();

    // Simulate work
    for (let i = 0; i < 10; i++) {
      spinner.text = `Processing step ${i + 1}/10`;
      await new Promise((resolve) => setImmediate(resolve));
    }

    spinner.succeed("Processing complete");
  })
  .add("Format Sections and Tables", () => {
    const { formatSection, formatTable } = require("../shared/cli-utils");

    // Format section
    const section = formatSection("Benchmark Results", {
      border: true,
      width: 50,
    });

    // Format table
    const data = [
      { name: "Test 1", time: "10ms", status: "passed" },
      { name: "Test 2", time: "25ms", status: "passed" },
      { name: "Test 3", time: "5ms", status: "failed" },
    ];

    const table = formatTable(data, {
      headers: ["Name", "Time", "Status"],
      alignment: ["left", "right", "center"],
    });

    if (!section || !table) {
      throw new Error("Formatting failed");
    }
  });

/**
 * Run all benchmark suites
 */
async function runAllBenchmarks() {
  console.log("Starting REST-SPEC Performance Benchmarks...\n");

  const suites = [
    configBenchmarks,
    validationBenchmarks,
    securityBenchmarks,
    errorBenchmarks,
    utilityBenchmarks,
  ];

  const results = [];

  for (const benchmarkSuite of suites) {
    try {
      const result = await benchmarkSuite.run();
      results.push(result);
      console.log("\n" + "=".repeat(60) + "\n");
    } catch (error) {
      console.error(`\nBenchmark suite failed: ${error.message}`);
    }
  }

  // Save combined results
  const combinedResults = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      memory: os.totalmem(),
    },
    suites: results,
  };

  await fs.mkdir(path.dirname("benchmarks/results/combined.json"), {
    recursive: true,
  });
  await fs.writeFile(
    "benchmarks/results/combined.json",
    JSON.stringify(combinedResults, null, 2),
  );

  console.log("\nAll benchmarks completed!");
  console.log("Results saved to benchmarks/results/");
}

// Run benchmarks if executed directly
if (require.main === module) {
  runAllBenchmarks().catch(console.error);
}

module.exports = {
  configBenchmarks,
  validationBenchmarks,
  securityBenchmarks,
  errorBenchmarks,
  utilityBenchmarks,
  runAllBenchmarks,
};
