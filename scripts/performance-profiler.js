#!/usr/bin/env node

/**
 * Performance Profiling Tools
 *
 * Comprehensive performance monitoring and profiling utilities
 * for Node.js/Express applications following REST-SPEC conventions
 *
 * @author REST-SPEC
 */

const fs = require("fs").promises;
const path = require("path");
const { performance } = require("perf_hooks");
const { program } = require("commander");

// Simple color functions for output
const color = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  constructor(options = {}) {
    this.metrics = new Map();
    this.timers = new Map();
    this.memorySnapshots = [];
    this.options = {
      enableGC: options.enableGC || false,
      sampleInterval: options.sampleInterval || 1000,
      maxSamples: options.maxSamples || 1000,
      outputFile: options.outputFile || null,
      ...options,
    };

    this.isMonitoring = false;
    this.intervalId = null;
  }

  /**
   * Start monitoring performance
   */
  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.startTime = performance.now();

    // Start memory monitoring
    this.intervalId = setInterval(() => {
      this.recordMemorySnapshot();
    }, this.options.sampleInterval);

    console.log(color.green("✓ Performance monitoring started"));
  }

  /**
   * Stop monitoring performance
   */
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.endTime = performance.now();
    console.log(color.green("✓ Performance monitoring stopped"));
  }

  /**
   * Start timing an operation
   */
  startTimer(name) {
    this.timers.set(name, {
      start: performance.now(),
      startMemory: process.memoryUsage(),
    });
  }

  /**
   * End timing an operation
   */
  endTimer(name) {
    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(color.yellow(`Warning: Timer "${name}" not found`));
      return null;
    }

    const duration = performance.now() - timer.start;
    const endMemory = process.memoryUsage();

    const metrics = {
      name,
      duration,
      memory: {
        start: timer.startMemory,
        end: endMemory,
        delta: {
          rss: endMemory.rss - timer.startMemory.rss,
          heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
          external: endMemory.external - timer.startMemory.external,
        },
      },
      timestamp: new Date().toISOString(),
    };

    this.metrics.set(name, metrics);
    this.timers.delete(name);

    return metrics;
  }

  /**
   * Record memory snapshot
   */
  recordMemorySnapshot() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
    };

    this.memorySnapshots.push(snapshot);

    // Limit snapshots to prevent memory leaks
    if (this.memorySnapshots.length > this.options.maxSamples) {
      this.memorySnapshots.shift();
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    const totalDuration = this.endTime - this.startTime;
    const avgMemory = this.calculateAverageMemory();
    const peakMemory = this.calculatePeakMemory();

    return {
      summary: {
        totalDuration,
        totalSamples: this.memorySnapshots.length,
        metricsCount: this.metrics.size,
        avgMemory,
        peakMemory,
      },
      metrics: Array.from(this.metrics.values()),
      memorySnapshots: this.memorySnapshots,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate average memory usage
   */
  calculateAverageMemory() {
    if (this.memorySnapshots.length === 0) return null;

    const total = this.memorySnapshots.reduce(
      (acc, snapshot) => ({
        rss: acc.rss + snapshot.memory.rss,
        heapUsed: acc.heapUsed + snapshot.memory.heapUsed,
        heapTotal: acc.heapTotal + snapshot.memory.heapTotal,
        external: acc.external + snapshot.memory.external,
      }),
      { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 },
    );

    const count = this.memorySnapshots.length;
    return {
      rss: total.rss / count,
      heapUsed: total.heapUsed / count,
      heapTotal: total.heapTotal / count,
      external: total.external / count,
    };
  }

  /**
   * Calculate peak memory usage
   */
  calculatePeakMemory() {
    if (this.memorySnapshots.length === 0) return null;

    return this.memorySnapshots.reduce(
      (peak, snapshot) => ({
        rss: Math.max(peak.rss, snapshot.memory.rss),
        heapUsed: Math.max(peak.heapUsed, snapshot.memory.heapUsed),
        heapTotal: Math.max(peak.heapTotal, snapshot.memory.heapTotal),
        external: Math.max(peak.external, snapshot.memory.external),
      }),
      { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 },
    );
  }

  /**
   * Export report to file
   */
  async exportReport(filePath = null) {
    const report = this.getReport();
    const outputPath =
      filePath ||
      this.options.outputFile ||
      path.join(process.cwd(), `performance-report-${Date.now()}.json`);

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(color.green(`✓ Performance report exported to: ${outputPath}`));

    return outputPath;
  }
}

/**
 * Express Middleware for automatic performance monitoring
 */
function createPerformanceMiddleware(options = {}) {
  const monitor = new PerformanceMonitor(options);

  return (req, res, next) => {
    // const startTime = performance.now();
    const requestId = `${req.method}-${req.path}-${Date.now()}`;

    monitor.startTimer(requestId);

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function (...args) {
      const metrics = monitor.endTimer(requestId);

      // Add request-specific metrics
      res.set("X-Response-Time", `${metrics.duration.toFixed(2)}ms`);
      res.set(
        "X-Memory-Usage",
        `${(metrics.memory.end.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      );

      // Log slow requests
      if (metrics.duration > (options.slowRequestThreshold || 1000)) {
        console.warn(
          color.yellow(
            `Slow request detected: ${req.method} ${req.path} - ${metrics.duration.toFixed(2)}ms`,
          ),
        );
      }

      originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * CPU Profiler
 */
class CPUProfiler {
  constructor() {
    this.samples = [];
    this.isActive = false;
    this.intervalId = null;
  }

  start(duration = 10000, interval = 100) {
    if (this.isActive) {
      console.warn(color.yellow("CPU profiler is already active"));
      return;
    }

    this.isActive = true;
    this.samples = [];
    const startTime = performance.now();

    console.log(color.cyan(`Starting CPU profiler for ${duration}ms...`));

    this.intervalId = setInterval(() => {
      const now = performance.now();
      const cpuUsage = process.cpuUsage();

      this.samples.push({
        timestamp: now - startTime,
        cpuUsage,
        memoryUsage: process.memoryUsage(),
      });
    }, interval);

    // Auto-stop after duration
    setTimeout(() => {
      this.stop();
    }, duration);
  }

  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log(
      color.green(`✓ CPU profiling completed (${this.samples.length} samples)`),
    );
  }

  getReport() {
    if (this.samples.length === 0) {
      return { error: "No samples collected" };
    }

    const totalCPU = this.samples.reduce(
      (acc, sample) => ({
        user: acc.user + sample.cpuUsage.user,
        system: acc.system + sample.cpuUsage.system,
      }),
      { user: 0, system: 0 },
    );

    const avgCPU = {
      user: totalCPU.user / this.samples.length,
      system: totalCPU.system / this.samples.length,
    };

    return {
      samples: this.samples,
      summary: {
        totalSamples: this.samples.length,
        avgCPU,
        peakMemory: this.samples.reduce(
          (peak, sample) => Math.max(peak, sample.memoryUsage.heapUsed),
          0,
        ),
      },
    };
  }
}

/**
 * Memory Leak Detector
 */
class MemoryLeakDetector {
  constructor(options = {}) {
    this.snapshots = [];
    this.options = {
      interval: options.interval || 5000,
      maxSnapshots: options.maxSnapshots || 100,
      threshold: options.threshold || 50 * 1024 * 1024, // 50MB
      ...options,
    };
    this.isActive = false;
    this.intervalId = null;
  }

  start() {
    if (this.isActive) return;

    this.isActive = true;
    this.snapshots = [];

    console.log(color.cyan("Starting memory leak detection..."));

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, this.options.interval);
  }

  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log(color.green("✓ Memory leak detection stopped"));
  }

  takeSnapshot() {
    if (global.gc && this.options.forceGC) {
      global.gc();
    }

    const snapshot = {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };

    this.snapshots.push(snapshot);

    // Limit snapshots
    if (this.snapshots.length > this.options.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check for potential leaks
    this.checkForLeaks(snapshot);
  }

  checkForLeaks(currentSnapshot) {
    if (this.snapshots.length < 5) return; // Need some history

    const recentSnapshots = this.snapshots.slice(-5);
    const memoryGrowth =
      currentSnapshot.memory.heapUsed - recentSnapshots[0].memory.heapUsed;

    if (memoryGrowth > this.options.threshold) {
      console.warn(
        color.red(
          `⚠️  Potential memory leak detected: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB increase`,
        ),
      );
    }
  }

  getReport() {
    if (this.snapshots.length === 0) {
      return { error: "No snapshots available" };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const growth = {
      rss: last.memory.rss - first.memory.rss,
      heapUsed: last.memory.heapUsed - first.memory.heapUsed,
      heapTotal: last.memory.heapTotal - first.memory.heapTotal,
      external: last.memory.external - first.memory.external,
    };

    return {
      snapshots: this.snapshots,
      summary: {
        totalSnapshots: this.snapshots.length,
        duration: last.uptime - first.uptime,
        memoryGrowth: growth,
        avgGrowthRate: {
          rss: growth.rss / this.snapshots.length,
          heapUsed: growth.heapUsed / this.snapshots.length,
          heapTotal: growth.heapTotal / this.snapshots.length,
          external: growth.external / this.snapshots.length,
        },
      },
    };
  }
}

/**
 * Request Performance Analyzer
 */
class RequestAnalyzer {
  constructor() {
    this.requests = [];
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    this.requests = [];
    console.log(color.cyan("Request performance analyzer started"));
  }

  stop() {
    this.isActive = false;
    console.log(color.green("✓ Request performance analyzer stopped"));
  }

  recordRequest(req, res, duration, memoryUsage) {
    if (!this.isActive) return;

    const request = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      memoryUsage,
      timestamp: new Date().toISOString(),
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get("Content-Length"),
    };

    this.requests.push(request);
  }

  getReport() {
    if (this.requests.length === 0) {
      return { error: "No requests recorded" };
    }

    const sortedByDuration = [...this.requests].sort(
      (a, b) => b.duration - a.duration,
    );
    const avgDuration =
      this.requests.reduce((sum, req) => sum + req.duration, 0) /
      this.requests.length;

    const statusCodes = this.requests.reduce((acc, req) => {
      acc[req.statusCode] = (acc[req.statusCode] || 0) + 1;
      return acc;
    }, {});

    const methods = this.requests.reduce((acc, req) => {
      acc[req.method] = (acc[req.method] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalRequests: this.requests.length,
        avgDuration,
        slowestRequests: sortedByDuration.slice(0, 10),
        statusCodes,
        methods,
      },
      requests: this.requests,
    };
  }
}

/**
 * Performance Report Generator
 */
class ReportGenerator {
  static formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static formatDuration(ms) {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  static generateConsoleReport(data) {
    console.log("\n" + color.bold("=".repeat(60)));
    console.log(color.bold("PERFORMANCE REPORT"));
    console.log(color.bold("=".repeat(60)));

    if (data.summary) {
      console.log("\n" + color.cyan("Summary:"));
      console.log(
        `  Total Duration: ${color.yellow(this.formatDuration(data.summary.totalDuration))}`,
      );
      console.log(
        `  Total Samples: ${color.yellow(data.summary.totalSamples)}`,
      );
      console.log(
        `  Metrics Count: ${color.yellow(data.summary.metricsCount)}`,
      );

      if (data.summary.avgMemory) {
        console.log(
          `  Avg Memory: ${color.yellow(this.formatBytes(data.summary.avgMemory.heapUsed))}`,
        );
      }

      if (data.summary.peakMemory) {
        console.log(
          `  Peak Memory: ${color.yellow(this.formatBytes(data.summary.peakMemory.heapUsed))}`,
        );
      }
    }

    if (data.metrics && data.metrics.length > 0) {
      console.log("\n" + color.cyan("Slowest Operations:"));
      const sorted = data.metrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);
      sorted.forEach((metric, i) => {
        console.log(
          `  ${i + 1}. ${color.yellow(metric.name)}: ${this.formatDuration(metric.duration)}`,
        );
      });
    }

    console.log("\n" + color.bold("=".repeat(60)) + "\n");
  }
}

/**
 * CLI Commands
 */

// Monitor command
async function monitorCommand(options) {
  const monitor = new PerformanceMonitor({
    sampleInterval: options.interval,
    outputFile: options.output,
    enableGC: options.gc,
  });

  monitor.start();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n" + color.yellow("Stopping performance monitoring..."));
    monitor.stop();

    const report = monitor.getReport();
    ReportGenerator.generateConsoleReport(report);

    if (options.output) {
      await monitor.exportReport(options.output);
    }

    process.exit(0);
  });

  // Keep process alive
  setInterval(() => {}, 1000);
}

// Profile command
async function profileCommand(target, options) {
  console.log(color.cyan(`Starting performance profile of: ${target}`));

  const monitor = new PerformanceMonitor();
  const cpuProfiler = new CPUProfiler();
  const leakDetector = new MemoryLeakDetector();

  monitor.start();
  cpuProfiler.start(options.duration, options.interval);
  leakDetector.start();

  // Simulate or wait for process
  setTimeout(async () => {
    monitor.stop();
    cpuProfiler.stop();
    leakDetector.stop();

    const performanceReport = monitor.getReport();
    const cpuReport = cpuProfiler.getReport();
    const memoryReport = leakDetector.getReport();

    const combinedReport = {
      performance: performanceReport,
      cpu: cpuReport,
      memory: memoryReport,
      generatedAt: new Date().toISOString(),
    };

    ReportGenerator.generateConsoleReport(performanceReport);

    if (options.output) {
      await fs.writeFile(
        options.output,
        JSON.stringify(combinedReport, null, 2),
      );
      console.log(
        color.green(`✓ Full profile report saved to: ${options.output}`),
      );
    }
  }, options.duration);
}

// Analyze command
async function analyzeCommand(logFile, _options) {
  try {
    const data = await fs.readFile(logFile, "utf8");
    const report = JSON.parse(data);

    console.log(color.cyan(`Analyzing performance report: ${logFile}`));
    ReportGenerator.generateConsoleReport(report);

    // Additional analysis
    if (report.memorySnapshots) {
      const memoryTrend = report.memorySnapshots.slice(-10);
      const isIncreasing = memoryTrend.every(
        (snapshot, i) =>
          i === 0 ||
          snapshot.memory.heapUsed >= memoryTrend[i - 1].memory.heapUsed,
      );

      if (isIncreasing) {
        console.log(
          color.red("⚠️  Memory usage appears to be consistently increasing"),
        );
      }
    }
  } catch (error) {
    console.error(color.red(`Error analyzing report: ${error.message}`));
    process.exit(1);
  }
}

// Benchmark command
async function benchmarkCommand(options) {
  console.log(color.cyan("Running performance benchmark..."));

  const results = {
    sync: [],
    async: [],
    memory: [],
  };

  // Synchronous operations benchmark
  console.log("Testing synchronous operations...");
  for (let i = 0; i < options.iterations; i++) {
    const start = performance.now();

    // Simulate CPU-intensive work
    let sum = 0;
    for (let j = 0; j < 1000000; j++) {
      sum += Math.random();
    }
    // Use sum to prevent optimization
    if (sum < 0) console.log(sum);

    results.sync.push(performance.now() - start);
  }

  // Asynchronous operations benchmark
  console.log("Testing asynchronous operations...");
  for (let i = 0; i < options.iterations; i++) {
    const start = performance.now();

    await new Promise((resolve) => {
      setImmediate(() => {
        let sum = 0;
        for (let j = 0; j < 100000; j++) {
          sum += Math.random();
        }
        // Use sum to prevent optimization
        if (sum < 0) console.log(sum);
        resolve();
      });
    });

    results.async.push(performance.now() - start);
  }

  // Memory allocation benchmark
  console.log("Testing memory allocation...");
  for (let i = 0; i < options.iterations; i++) {
    const before = process.memoryUsage();

    // Allocate and deallocate memory
    const arr = new Array(100000).fill(0).map(() => ({ data: Math.random() }));

    const after = process.memoryUsage();
    // Use arr to prevent optimization
    if (arr.length < 0) console.log(arr.length);
    results.memory.push(after.heapUsed - before.heapUsed);
  }

  // Calculate statistics
  const calculateStats = (arr) => ({
    min: Math.min(...arr),
    max: Math.max(...arr),
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    median: arr.sort((a, b) => a - b)[Math.floor(arr.length / 2)],
  });

  const report = {
    sync: calculateStats(results.sync),
    async: calculateStats(results.async),
    memory: calculateStats(results.memory),
    iterations: options.iterations,
    timestamp: new Date().toISOString(),
  };

  // Display results
  console.log("\n" + color.bold("BENCHMARK RESULTS"));
  console.log(color.bold("=".repeat(40)));
  console.log(
    `${color.cyan("Synchronous Operations:")} ${ReportGenerator.formatDuration(report.sync.avg)} avg`,
  );
  console.log(
    `${color.cyan("Asynchronous Operations:")} ${ReportGenerator.formatDuration(report.async.avg)} avg`,
  );
  console.log(
    `${color.cyan("Memory Allocation:")} ${ReportGenerator.formatBytes(report.memory.avg)} avg`,
  );

  if (options.output) {
    await fs.writeFile(options.output, JSON.stringify(report, null, 2));
    console.log(color.green(`✓ Benchmark report saved to: ${options.output}`));
  }
}

/**
 * Main CLI function
 */
async function main() {
  program
    .name("performance-profiler")
    .description("Performance profiling and monitoring tools")
    .version("1.0.0");

  program
    .command("monitor")
    .description("Start real-time performance monitoring")
    .option("-i, --interval <ms>", "Sample interval in milliseconds", "1000")
    .option("-o, --output <file>", "Output file for report")
    .option("--gc", "Enable garbage collection monitoring")
    .action(monitorCommand);

  program
    .command("profile <target>")
    .description("Profile a specific process or operation")
    .option("-d, --duration <ms>", "Profile duration in milliseconds", "10000")
    .option("-i, --interval <ms>", "Sample interval in milliseconds", "100")
    .option("-o, --output <file>", "Output file for report")
    .action(profileCommand);

  program
    .command("analyze <file>")
    .description("Analyze a performance report file")
    .option("-f, --format <type>", "Output format (console, html)", "console")
    .action(analyzeCommand);

  program
    .command("benchmark")
    .description("Run performance benchmarks")
    .option("-n, --iterations <count>", "Number of iterations", "100")
    .option("-o, --output <file>", "Output file for results")
    .action(benchmarkCommand);

  await program.parseAsync(process.argv);
}

// Export classes and middleware for programmatic use
module.exports = {
  PerformanceMonitor,
  CPUProfiler,
  MemoryLeakDetector,
  RequestAnalyzer,
  ReportGenerator,
  createPerformanceMiddleware,
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(color.red("Error:"), error.message);
    process.exit(1);
  });
}
