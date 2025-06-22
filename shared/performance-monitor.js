/**
 * Performance Monitoring Utilities
 *
 * Core utilities for measuring and tracking performance metrics
 * including execution time, memory usage, and file I/O operations.
 *
 * @author Karl Groves
 */

const { performance } = require("perf_hooks");
const v8 = require("v8");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

/**
 * Performance metric types
 */
const MetricType = {
  EXECUTION_TIME: "execution_time",
  MEMORY_USAGE: "memory_usage",
  FILE_IO: "file_io",
  CPU_USAGE: "cpu_usage",
  HEAP_USAGE: "heap_usage",
};

/**
 * Performance monitor class for tracking various metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
    this.measures = new Map();
    this.initialMemory = process.memoryUsage();
    this.initialCpuUsage = process.cpuUsage();
  }

  /**
   * Starts a performance measurement
   * @param {string} name - Name of the measurement
   */
  start(name) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, {
      start: markName,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      startCpu: process.cpuUsage(),
    });
  }

  /**
   * Ends a performance measurement and records metrics
   * @param {string} name - Name of the measurement
   * @returns {Object} Performance metrics
   */
  end(name) {
    const markData = this.marks.get(name);
    if (!markData) {
      throw new Error(`No start mark found for '${name}'`);
    }

    const endMarkName = `${name}-end`;
    performance.mark(endMarkName);

    // Measure execution time
    const measureName = `${name}-duration`;
    performance.measure(measureName, markData.start, endMarkName);

    const measure = performance.getEntriesByName(measureName)[0];
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage();

    // Calculate metrics
    const metrics = {
      name,
      executionTime: measure.duration,
      startTime: markData.startTime,
      endTime,
      memory: {
        rss: endMemory.rss - markData.startMemory.rss,
        heapTotal: endMemory.heapTotal - markData.startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - markData.startMemory.heapUsed,
        external: endMemory.external - markData.startMemory.external,
        arrayBuffers:
          endMemory.arrayBuffers - markData.startMemory.arrayBuffers,
      },
      cpu: {
        user: (endCpu.user - markData.startCpu.user) / 1000, // Convert to milliseconds
        system: (endCpu.system - markData.startCpu.system) / 1000,
      },
      heap: v8.getHeapStatistics(),
    };

    // Store metrics
    const existingMetrics = this.metrics.get(name) || [];
    existingMetrics.push(metrics);
    this.metrics.set(name, existingMetrics);

    // Clean up marks
    performance.clearMarks(markData.start);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);
    this.marks.delete(name);

    return metrics;
  }

  /**
   * Wraps an async function with performance monitoring
   * @param {string} name - Name of the operation
   * @param {Function} fn - Function to monitor
   * @returns {*} Result of the function
   */
  async monitor(name, fn) {
    this.start(name);
    try {
      const result = await fn();
      const metrics = this.end(name);
      return { result, metrics };
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Monitors file I/O operations
   * @param {string} operation - Type of file operation
   * @param {string} filePath - Path to the file
   * @param {Function} fn - File operation function
   * @returns {Object} Operation result and metrics
   */
  async monitorFileIO(operation, filePath, fn) {
    const name = `file-io-${operation}-${path.basename(filePath)}`;
    const startStats = await this.getFileStats(filePath).catch(() => null);

    this.start(name);
    try {
      const result = await fn();
      const metrics = this.end(name);

      const endStats = await this.getFileStats(filePath).catch(() => null);
      metrics.fileIO = {
        operation,
        path: filePath,
        startSize: startStats?.size || 0,
        endSize: endStats?.size || 0,
        sizeChange: (endStats?.size || 0) - (startStats?.size || 0),
      };

      return { result, metrics };
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Gets file statistics
   * @param {string} filePath - Path to the file
   * @returns {Object} File stats
   */
  async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets all metrics for a specific operation
   * @param {string} name - Name of the operation
   * @returns {Array} Array of metrics
   */
  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  /**
   * Gets aggregated metrics for an operation
   * @param {string} name - Name of the operation
   * @returns {Object} Aggregated metrics
   */
  getAggregatedMetrics(name) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const executionTimes = metrics.map((m) => m.executionTime);
    const memoryUsages = metrics.map((m) => m.memory.heapUsed);
    const cpuUsages = metrics.map((m) => m.cpu.user + m.cpu.system);

    return {
      name,
      count: metrics.length,
      executionTime: {
        min: Math.min(...executionTimes),
        max: Math.max(...executionTimes),
        avg: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
        median: this.calculateMedian(executionTimes),
        p95: this.calculatePercentile(executionTimes, 95),
        p99: this.calculatePercentile(executionTimes, 99),
      },
      memory: {
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
        avg: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      },
      cpu: {
        min: Math.min(...cpuUsages),
        max: Math.max(...cpuUsages),
        avg: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      },
    };
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
   * Gets system information
   * @returns {Object} System information
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      nodeVersion: process.version,
      v8Version: process.versions.v8,
    };
  }

  /**
   * Exports metrics to JSON
   * @param {string} outputPath - Path to save metrics
   */
  async exportMetrics(outputPath) {
    const allMetrics = {};
    for (const [name, metrics] of this.metrics) {
      allMetrics[name] = {
        raw: metrics,
        aggregated: this.getAggregatedMetrics(name),
      };
    }

    const report = {
      timestamp: new Date().toISOString(),
      system: this.getSystemInfo(),
      metrics: allMetrics,
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    return report;
  }

  /**
   * Resets all metrics
   */
  reset() {
    this.metrics.clear();
    this.marks.clear();
    this.measures.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

/**
 * Creates a global performance monitor instance
 */
let globalMonitor = null;

/**
 * Gets or creates the global performance monitor
 * @returns {PerformanceMonitor} Global monitor instance
 */
function getGlobalMonitor() {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

/**
 * Formats bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = Math.abs(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formatted = size.toFixed(2);
  return bytes < 0
    ? `-${formatted} ${units[unitIndex]}`
    : `${formatted} ${units[unitIndex]}`;
}

/**
 * Formats duration to human readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

module.exports = {
  PerformanceMonitor,
  MetricType,
  getGlobalMonitor,
  formatBytes,
  formatDuration,
};
