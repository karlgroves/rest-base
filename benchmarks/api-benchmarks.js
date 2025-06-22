/**
 * API Performance Benchmarks
 *
 * Performance benchmarks for REST API components including
 * routing, middleware, database operations, and request handling.
 *
 * @author Karl Groves
 */

const { suite } = require("./benchmark-runner");
const http = require("http");
const express = require("express");

/**
 * Mock database operations for benchmarking
 */
class MockDatabase {
  constructor() {
    this.data = new Map();
    this.queryCount = 0;

    // Pre-populate with test data
    for (let i = 1; i <= 1000; i++) {
      this.data.set(`user:${i}`, {
        id: i,
        username: `user${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  async findById(id) {
    this.queryCount++;
    // Simulate database latency
    await new Promise((resolve) => setImmediate(resolve));
    return this.data.get(`user:${id}`);
  }

  async findAll(limit = 10, offset = 0) {
    this.queryCount++;
    await new Promise((resolve) => setImmediate(resolve));

    const results = [];
    const keys = Array.from(this.data.keys());

    for (let i = offset; i < Math.min(offset + limit, keys.length); i++) {
      results.push(this.data.get(keys[i]));
    }

    return results;
  }

  async create(data) {
    this.queryCount++;
    await new Promise((resolve) => setImmediate(resolve));

    const id = this.data.size + 1;
    const record = { id, ...data, createdAt: new Date().toISOString() };
    this.data.set(`user:${id}`, record);
    return record;
  }

  async update(id, data) {
    this.queryCount++;
    await new Promise((resolve) => setImmediate(resolve));

    const key = `user:${id}`;
    if (!this.data.has(key)) {
      throw new Error("Record not found");
    }

    const record = {
      ...this.data.get(key),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.data.set(key, record);
    return record;
  }

  resetStats() {
    this.queryCount = 0;
  }
}

/**
 * Create test Express application
 */
function createTestApp() {
  const app = express();
  const db = new MockDatabase();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, res, _next) => {
    req.startTime = process.hrtime.bigint();
    res.on("finish", () => {
      const duration = Number(process.hrtime.bigint() - req.startTime) / 1e6;
      req.duration = duration;
    });
    _next();
  });

  // Routes
  app.get("/api/users", async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const users = await db.findAll(parseInt(limit), parseInt(offset));
    res.json({
      status: "success",
      data: users,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: db.data.size,
      },
    });
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await db.findById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    res.json({
      status: "success",
      data: user,
    });
  });

  app.post("/api/users", async (req, res) => {
    const user = await db.create(req.body);
    res.status(201).json({
      status: "success",
      data: user,
    });
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const user = await db.update(parseInt(req.params.id), req.body);
      res.json({
        status: "success",
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        status: "error",
        message: error.message,
      });
    }
  });

  // Error handling
  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  });

  return { app, db };
}

/**
 * HTTP request helper
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Routing benchmarks
 */
const routingBenchmarks = suite("API Routing", {
  warmupRuns: 10,
  iterations: 1000,
  output: {
    file: "benchmarks/results/api-routing.json",
  },
})
  .beforeAll(async function () {
    const { app, db } = createTestApp();
    this.db = db;
    this.server = http.createServer(app);

    await new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", resolve);
    });

    this.port = this.server.address().port;
    this.baseOptions = {
      hostname: "127.0.0.1",
      port: this.port,
      headers: {
        "Content-Type": "application/json",
      },
    };
  })
  .add("GET /api/users - List Users", async function () {
    const response = await makeRequest({
      ...this.baseOptions,
      method: "GET",
      path: "/api/users?limit=10",
    });

    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  })
  .add("GET /api/users/:id - Get Single User", async function () {
    const response = await makeRequest({
      ...this.baseOptions,
      method: "GET",
      path: "/api/users/1",
    });

    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  })
  .add("POST /api/users - Create User", async function () {
    const response = await makeRequest({
      ...this.baseOptions,
      method: "POST",
      path: "/api/users",
      body: {
        username: "benchmarkuser",
        email: "benchmark@example.com",
      },
    });

    if (response.statusCode !== 201) {
      throw new Error(`Expected 201, got ${response.statusCode}`);
    }
  })
  .add("PUT /api/users/:id - Update User", async function () {
    const response = await makeRequest({
      ...this.baseOptions,
      method: "PUT",
      path: "/api/users/1",
      body: {
        username: "updateduser",
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  })
  .add("404 Not Found - Non-existent Route", async function () {
    const response = await makeRequest({
      ...this.baseOptions,
      method: "GET",
      path: "/api/nonexistent",
    });

    if (response.statusCode !== 404) {
      throw new Error(`Expected 404, got ${response.statusCode}`);
    }
  })
  .afterAll(async function () {
    await new Promise((resolve) => {
      this.server.close(resolve);
    });
  });

/**
 * Middleware benchmarks
 */
const middlewareBenchmarks = suite("API Middleware", {
  warmupRuns: 5,
  iterations: 500,
  output: {
    file: "benchmarks/results/api-middleware.json",
  },
})
  .beforeAll(async function () {
    const app = express();

    // Test middleware stack
    const middlewares = {
      logging: 0,
      auth: 0,
      validation: 0,
      rateLimit: 0,
    };

    // Logging middleware
    app.use((req, res, next) => {
      middlewares.logging++;
      req.log = { timestamp: Date.now() };
      next();
    });

    // Auth middleware
    app.use((req, res, next) => {
      middlewares.auth++;
      const token = req.headers.authorization;
      req.user = token ? { id: 1, role: "user" } : null;
      next();
    });

    // Validation middleware
    app.use((req, res, next) => {
      middlewares.validation++;
      if (req.method === "POST" && !req.body) {
        return res.status(400).json({ error: "Body required" });
      }
      next();
    });

    // Rate limiting middleware
    const requestCounts = new Map();
    app.use((req, res, next) => {
      middlewares.rateLimit++;
      const ip = req.ip;
      const count = requestCounts.get(ip) || 0;

      if (count > 100) {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }

      requestCounts.set(ip, count + 1);
      next();
    });

    // Test endpoint
    app.all("/test", (req, res) => {
      res.json({
        success: true,
        middlewares: Object.keys(middlewares).filter((m) => middlewares[m] > 0),
      });
    });

    this.middlewares = middlewares;
    this.server = http.createServer(app);

    await new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", resolve);
    });

    this.port = this.server.address().port;
  })
  .add("Minimal Middleware Stack", async function () {
    const response = await makeRequest({
      hostname: "127.0.0.1",
      port: this.port,
      method: "GET",
      path: "/test",
    });

    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  })
  .add("Full Middleware Stack with Auth", async function () {
    const response = await makeRequest({
      hostname: "127.0.0.1",
      port: this.port,
      method: "POST",
      path: "/test",
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      },
      body: { test: true },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
  })
  .afterAll(async function () {
    await new Promise((resolve) => {
      this.server.close(resolve);
    });
  });

/**
 * Database operation benchmarks
 */
const databaseBenchmarks = suite("Database Operations", {
  warmupRuns: 5,
  iterations: 100,
  output: {
    file: "benchmarks/results/database-ops.json",
  },
})
  .beforeAll(function () {
    this.db = new MockDatabase();
  })
  .add("Single Record Lookup", async function () {
    const user = await this.db.findById(Math.floor(Math.random() * 1000) + 1);
    if (!user) {
      throw new Error("User not found");
    }
  })
  .add("Batch Record Lookup (10 records)", async function () {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(this.db.findById(Math.floor(Math.random() * 1000) + 1));
    }
    const results = await Promise.all(promises);
    if (results.some((r) => !r)) {
      throw new Error("Some users not found");
    }
  })
  .add("List Query with Pagination", async function () {
    const users = await this.db.findAll(20, 100);
    if (users.length !== 20) {
      throw new Error("Incorrect number of users returned");
    }
  })
  .add("Create Record", async function () {
    const user = await this.db.create({
      username: `benchmark${Date.now()}`,
      email: `benchmark${Date.now()}@example.com`,
    });
    if (!user.id) {
      throw new Error("User creation failed");
    }
  })
  .add("Update Record", async function () {
    const id = Math.floor(Math.random() * 1000) + 1;
    const user = await this.db.update(id, {
      username: `updated${Date.now()}`,
    });
    if (!user.updatedAt) {
      throw new Error("User update failed");
    }
  });

/**
 * Load testing benchmarks
 */
const loadTestingBenchmarks = suite("Load Testing", {
  warmupRuns: 2,
  iterations: 10,
  output: {
    file: "benchmarks/results/load-testing.json",
  },
})
  .beforeAll(async function () {
    const { app, db } = createTestApp();
    this.db = db;
    this.server = http.createServer(app);

    await new Promise((resolve) => {
      this.server.listen(0, "127.0.0.1", resolve);
    });

    this.port = this.server.address().port;
  })
  .add("Concurrent Requests (10)", async function () {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        makeRequest({
          hostname: "127.0.0.1",
          port: this.port,
          method: "GET",
          path: `/api/users/${i + 1}`,
        }),
      );
    }

    const results = await Promise.all(requests);
    if (results.some((r) => r.statusCode !== 200)) {
      throw new Error("Some requests failed");
    }
  })
  .add("Concurrent Requests (50)", async function () {
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(
        makeRequest({
          hostname: "127.0.0.1",
          port: this.port,
          method: "GET",
          path: `/api/users/${(i % 100) + 1}`,
        }),
      );
    }

    const results = await Promise.all(requests);
    if (results.some((r) => r.statusCode !== 200)) {
      throw new Error("Some requests failed");
    }
  })
  .add("Mixed Operations (Read/Write)", async function () {
    const requests = [];

    // 70% reads
    for (let i = 0; i < 70; i++) {
      requests.push(
        makeRequest({
          hostname: "127.0.0.1",
          port: this.port,
          method: "GET",
          path: `/api/users/${(i % 100) + 1}`,
        }),
      );
    }

    // 20% writes
    for (let i = 0; i < 20; i++) {
      requests.push(
        makeRequest({
          hostname: "127.0.0.1",
          port: this.port,
          method: "POST",
          path: "/api/users",
          headers: { "Content-Type": "application/json" },
          body: {
            username: `loadtest${i}`,
            email: `loadtest${i}@example.com`,
          },
        }),
      );
    }

    // 10% updates
    for (let i = 0; i < 10; i++) {
      requests.push(
        makeRequest({
          hostname: "127.0.0.1",
          port: this.port,
          method: "PUT",
          path: `/api/users/${i + 1}`,
          headers: { "Content-Type": "application/json" },
          body: {
            username: `updated${i}`,
          },
        }),
      );
    }

    const results = await Promise.all(requests);
    const successCount = results.filter((r) => r.statusCode < 400).length;

    if (successCount < 90) {
      throw new Error(
        `Too many failures: ${100 - successCount} requests failed`,
      );
    }
  })
  .afterAll(async function () {
    await new Promise((resolve) => {
      this.server.close(resolve);
    });
  });

/**
 * Run all API benchmarks
 */
async function runAllBenchmarks() {
  console.log("Starting REST API Performance Benchmarks...\n");

  const suites = [
    routingBenchmarks,
    middlewareBenchmarks,
    databaseBenchmarks,
    loadTestingBenchmarks,
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

  console.log("\nAll API benchmarks completed!");
}

// Run benchmarks if executed directly
if (require.main === module) {
  runAllBenchmarks().catch(console.error);
}

module.exports = {
  routingBenchmarks,
  middlewareBenchmarks,
  databaseBenchmarks,
  loadTestingBenchmarks,
  runAllBenchmarks,
};
