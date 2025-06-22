/**
 * Benchmark Runner Framework
 *
 * Framework for running performance benchmarks with warmup,
 * multiple iterations, and statistical analysis.
 *
 * @author Karl Groves
 */

const {
  PerformanceMonitor,
  formatDuration,
  formatBytes,
} = require("../shared/performance-monitor");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../shared/logger");
const { createSpinner } = require("../shared/cli-utils");

/**
 * Benchmark configuration
 */
const DEFAULT_CONFIG = {
  warmupRuns: 3,
  iterations: 10,
  timeout: 300000, // 5 minutes
  memory: {
    trackHeap: true,
    trackGC: true,
    forceGC: true,
  },
  output: {
    verbose: false,
    json: true,
    console: true,
    file: "benchmark-results.json",
  },
};

/**
 * Benchmark suite class
 */
class BenchmarkSuite {
  constructor(name, config = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.benchmarks = [];
    this.results = [];
    this.monitor = new PerformanceMonitor();
    this.setupHooks = [];
    this.teardownHooks = [];
  }

  /**
   * Adds a benchmark to the suite
   * @param {string} name - Benchmark name
   * @param {Function} fn - Benchmark function
   * @param {Object} options - Benchmark options
   */
  add(name, fn, options = {}) {
    this.benchmarks.push({
      name,
      fn,
      options: { ...this.config, ...options },
      results: [],
    });
    return this;
  }

  /**
   * Adds a setup hook
   * @param {Function} fn - Setup function
   */
  beforeAll(fn) {
    this.setupHooks.push(fn);
    return this;
  }

  /**
   * Adds a teardown hook
   * @param {Function} fn - Teardown function
   */
  afterAll(fn) {
    this.teardownHooks.push(fn);
    return this;
  }

  /**
   * Runs a single benchmark
   * @param {Object} benchmark - Benchmark configuration
   * @returns {Object} Benchmark results
   */
  async runBenchmark(benchmark) {
    const { name, fn, options } = benchmark;
    const results = [];

    if (this.config.output.console) {
      logger.info(`Running benchmark: ${name}`);
    }

    // Warmup runs
    if (options.warmupRuns > 0) {
      const spinner = createSpinner(`Warmup (${options.warmupRuns} runs)...`);
      spinner.start();

      for (let i = 0; i < options.warmupRuns; i++) {
        try {
          if (options.memory.forceGC && global.gc) {
            global.gc();
          }
          await fn();
        } catch (error) {
          spinner.fail(`Warmup failed: ${error.message}`);
          throw error;
        }
      }

      spinner.succeed("Warmup complete");
    }

    // Actual benchmark runs
    const spinner = createSpinner(
      `Running ${options.iterations} iterations...`,
    );
    spinner.start();

    for (let i = 0; i < options.iterations; i++) {
      try {
        // Force garbage collection before each run if enabled
        if (options.memory.forceGC && global.gc) {
          global.gc();
        }

        // Run with monitoring
        const { metrics } = await this.monitor.monitor(
          `${name}-${i}`,
          async () => {
            await fn();
          },
        );

        results.push(metrics);

        if (options.output.verbose) {
          spinner.text = `Iteration ${i + 1}/${options.iterations} - ${formatDuration(metrics.executionTime)}`;
        }
      } catch (error) {
        spinner.fail(
          `Benchmark failed at iteration ${i + 1}: ${error.message}`,
        );
        throw error;
      }
    }

    spinner.succeed(`Completed ${options.iterations} iterations`);

    // Analyze results
    const analysis = this.analyzeResults(results);
    benchmark.results = results;
    benchmark.analysis = analysis;

    return analysis;
  }

  /**
   * Analyzes benchmark results
   * @param {Array} results - Array of benchmark results
   * @returns {Object} Statistical analysis
   */
  analyzeResults(results) {
    const executionTimes = results.map((r) => r.executionTime);
    const memoryUsages = results.map((r) => r.memory.heapUsed);
    const cpuTimes = results.map((r) => r.cpu.user + r.cpu.system);

    return {
      iterations: results.length,
      executionTime: {
        min: Math.min(...executionTimes),
        max: Math.max(...executionTimes),
        mean: this.calculateMean(executionTimes),
        median: this.calculateMedian(executionTimes),
        stdDev: this.calculateStdDev(executionTimes),
        p95: this.calculatePercentile(executionTimes, 95),
        p99: this.calculatePercentile(executionTimes, 99),
        cv: this.calculateCoefficientOfVariation(executionTimes),
      },
      memory: {
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
        mean: this.calculateMean(memoryUsages),
        median: this.calculateMedian(memoryUsages),
        stdDev: this.calculateStdDev(memoryUsages),
      },
      cpu: {
        min: Math.min(...cpuTimes),
        max: Math.max(...cpuTimes),
        mean: this.calculateMean(cpuTimes),
        median: this.calculateMedian(cpuTimes),
      },
      throughput: {
        ops: 1000 / this.calculateMean(executionTimes), // Operations per second
        opsMin: 1000 / Math.max(...executionTimes),
        opsMax: 1000 / Math.min(...executionTimes),
      },
    };
  }

  /**
   * Calculates mean value
   * @param {Array<number>} values - Array of values
   * @returns {number} Mean value
   */
  calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculates median value
   * @param {Array<number>} values - Array of values
   * @returns {number} Median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculates standard deviation
   * @param {Array<number>} values - Array of values
   * @returns {number} Standard deviation
   */
  calculateStdDev(values) {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Calculates coefficient of variation
   * @param {Array<number>} values - Array of values
   * @returns {number} Coefficient of variation (percentage)
   */
  calculateCoefficientOfVariation(values) {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);
    return (stdDev / mean) * 100;
  }

  /**
   * Calculates percentile value
   * @param {Array<number>} values - Array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Runs all benchmarks in the suite
   * @returns {Object} Suite results
   */
  async run() {
    const suiteStartTime = Date.now();

    logger.heading(`Running benchmark suite: ${this.name}`);
    logger.info(`Configuration:`);
    logger.info(`  Warmup runs: ${this.config.warmupRuns}`);
    logger.info(`  Iterations: ${this.config.iterations}`);
    logger.info(`  Timeout: ${this.config.timeout}ms`);
    console.log();

    // Run setup hooks
    for (const hook of this.setupHooks) {
      await hook();
    }

    // Run benchmarks
    const results = [];
    for (const benchmark of this.benchmarks) {
      try {
        const result = await this.runBenchmark(benchmark);
        results.push({
          name: benchmark.name,
          ...result,
        });

        // Display results
        if (this.config.output.console) {
          this.displayBenchmarkResults(benchmark.name, result);
        }
      } catch (error) {
        logger.error(`Benchmark '${benchmark.name}' failed: ${error.message}`);
        results.push({
          name: benchmark.name,
          error: error.message,
        });
      }
    }

    // Run teardown hooks
    for (const hook of this.teardownHooks) {
      await hook();
    }

    const suiteEndTime = Date.now();
    const suiteDuration = suiteEndTime - suiteStartTime;

    // Prepare final results
    const finalResults = {
      suite: this.name,
      timestamp: new Date().toISOString(),
      duration: suiteDuration,
      config: this.config,
      system: this.monitor.getSystemInfo(),
      benchmarks: results,
    };

    // Save results
    if (this.config.output.json) {
      await this.saveResults(finalResults);
    }

    // Display summary
    if (this.config.output.console) {
      this.displaySummary(finalResults);
    }

    return finalResults;
  }

  /**
   * Displays benchmark results
   * @param {string} name - Benchmark name
   * @param {Object} result - Benchmark result
   */
  displayBenchmarkResults(name, result) {
    console.log();
    logger.success(`${name} Results:`);
    console.log(`  Execution Time:`);
    console.log(`    Mean: ${formatDuration(result.executionTime.mean)}`);
    console.log(`    Median: ${formatDuration(result.executionTime.median)}`);
    console.log(`    Min: ${formatDuration(result.executionTime.min)}`);
    console.log(`    Max: ${formatDuration(result.executionTime.max)}`);
    console.log(`    Std Dev: ${formatDuration(result.executionTime.stdDev)}`);
    console.log(`    CV: ${result.executionTime.cv.toFixed(2)}%`);
    console.log(`  Memory Usage:`);
    console.log(`    Mean: ${formatBytes(result.memory.mean)}`);
    console.log(`    Min: ${formatBytes(result.memory.min)}`);
    console.log(`    Max: ${formatBytes(result.memory.max)}`);
    console.log(`  Throughput:`);
    console.log(`    Ops/sec: ${result.throughput.ops.toFixed(2)}`);
  }

  /**
   * Displays suite summary
   * @param {Object} results - Suite results
   */
  displaySummary(results) {
    console.log();
    logger.heading("Benchmark Suite Summary");
    console.log(`Suite: ${results.suite}`);
    console.log(`Total Duration: ${formatDuration(results.duration)}`);
    console.log(`Benchmarks Run: ${results.benchmarks.length}`);

    const successful = results.benchmarks.filter((b) => !b.error).length;
    const failed = results.benchmarks.filter((b) => b.error).length;

    if (successful > 0) {
      logger.success(`Successful: ${successful}`);
    }
    if (failed > 0) {
      logger.error(`Failed: ${failed}`);
    }
  }

  /**
   * Saves benchmark results to file
   * @param {Object} results - Benchmark results
   */
  async saveResults(results) {
    const outputPath = path.resolve(this.config.output.file);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    logger.info(`Results saved to: ${outputPath}`);
  }
}

/**
 * Creates a new benchmark suite
 * @param {string} name - Suite name
 * @param {Object} config - Suite configuration
 * @returns {BenchmarkSuite} New suite instance
 */
function suite(name, config = {}) {
  return new BenchmarkSuite(name, config);
}

/**
 * Compares two benchmark results
 * @param {Object} baseline - Baseline results
 * @param {Object} current - Current results
 * @returns {Object} Comparison results
 */
function compareBenchmarks(baseline, current) {
  const comparison = {
    suite: current.suite,
    timestamp: new Date().toISOString(),
    baseline: {
      timestamp: baseline.timestamp,
      file: baseline.file,
    },
    current: {
      timestamp: current.timestamp,
    },
    benchmarks: [],
  };

  // Compare each benchmark
  for (const currentBench of current.benchmarks) {
    const baselineBench = baseline.benchmarks.find(
      (b) => b.name === currentBench.name,
    );

    if (!baselineBench || currentBench.error || baselineBench.error) {
      continue;
    }

    const change = {
      name: currentBench.name,
      executionTime: {
        baseline: baselineBench.executionTime.mean,
        current: currentBench.executionTime.mean,
        change:
          currentBench.executionTime.mean - baselineBench.executionTime.mean,
        changePercent:
          ((currentBench.executionTime.mean -
            baselineBench.executionTime.mean) /
            baselineBench.executionTime.mean) *
          100,
      },
      memory: {
        baseline: baselineBench.memory.mean,
        current: currentBench.memory.mean,
        change: currentBench.memory.mean - baselineBench.memory.mean,
        changePercent:
          ((currentBench.memory.mean - baselineBench.memory.mean) /
            baselineBench.memory.mean) *
          100,
      },
      throughput: {
        baseline: baselineBench.throughput.ops,
        current: currentBench.throughput.ops,
        change: currentBench.throughput.ops - baselineBench.throughput.ops,
        changePercent:
          ((currentBench.throughput.ops - baselineBench.throughput.ops) /
            baselineBench.throughput.ops) *
          100,
      },
    };

    // Determine if performance improved or degraded
    change.status = {
      executionTime:
        change.executionTime.changePercent < -5
          ? "improved"
          : change.executionTime.changePercent > 5
            ? "degraded"
            : "stable",
      memory:
        change.memory.changePercent < -5
          ? "improved"
          : change.memory.changePercent > 5
            ? "degraded"
            : "stable",
      throughput:
        change.throughput.changePercent > 5
          ? "improved"
          : change.throughput.changePercent < -5
            ? "degraded"
            : "stable",
    };

    comparison.benchmarks.push(change);
  }

  return comparison;
}

module.exports = {
  BenchmarkSuite,
  suite,
  compareBenchmarks,
  DEFAULT_CONFIG,
};
