# Performance Profiler

Comprehensive performance monitoring and profiling tools for Node.js/Express applications following REST-SPEC conventions.

## Features

- **Real-time Performance Monitoring**: Track CPU, memory, and request performance in real-time
- **CPU Profiling**: Detailed CPU usage analysis with sampling
- **Memory Leak Detection**: Automatic detection of potential memory leaks
- **Request Performance Analysis**: Monitor and analyze HTTP request performance
- **Express Middleware Integration**: Drop-in middleware for automatic monitoring
- **Comprehensive Reporting**: Generate detailed performance reports in multiple formats
- **Benchmarking Tools**: Built-in benchmarks for performance testing

## Installation

The performance profiler is included with REST-SPEC. No additional installation required.

## Quick Start

### Basic Monitoring

```bash
# Start real-time performance monitoring
npx rest-spec-profiler monitor

# Run performance profile for 30 seconds
npx rest-spec-profiler profile myapp --duration 30000

# Run benchmarks
npx rest-spec-profiler benchmark --iterations 1000

# Analyze existing performance report
npx rest-spec-profiler analyze performance-report.json
```

### Express Middleware Integration

```javascript
const express = require('express');
const { createPerformanceMiddleware } = require('rest-spec/scripts/performance-profiler');

const app = express();

// Add performance monitoring middleware
app.use(createPerformanceMiddleware({
  slowRequestThreshold: 1000, // Log requests slower than 1s
  enableGC: true,
  outputFile: './performance-logs.json'
}));

// Your routes
app.get('/api/users', (req, res) => {
  // This request will be automatically monitored
  res.json({ users: [] });
});
```

## Commands

### Monitor

Start real-time performance monitoring:

```bash
npx rest-spec-profiler monitor [options]
```

**Options:**

- `-i, --interval <ms>` - Sample interval in milliseconds (default: 1000)
- `-o, --output <file>` - Output file for report
- `--gc` - Enable garbage collection monitoring

**Example:**

```bash
# Monitor with 500ms intervals, save to file
npx rest-spec-profiler monitor -i 500 -o perf-report.json

# Monitor with GC tracking
npx rest-spec-profiler monitor --gc
```

### Profile

Profile a specific process or operation:

```bash
npx rest-spec-profiler profile <target> [options]
```

**Options:**

- `-d, --duration <ms>` - Profile duration in milliseconds (default: 10000)
- `-i, --interval <ms>` - Sample interval in milliseconds (default: 100)
- `-o, --output <file>` - Output file for report

**Example:**

```bash
# Profile for 60 seconds with detailed sampling
npx rest-spec-profiler profile myapp -d 60000 -i 50 -o profile.json
```

### Benchmark

Run performance benchmarks:

```bash
npx rest-spec-profiler benchmark [options]
```

**Options:**

- `-n, --iterations <count>` - Number of iterations (default: 100)
- `-o, --output <file>` - Output file for results

**Example:**

```bash
# Run 1000 iterations and save results
npx rest-spec-profiler benchmark -n 1000 -o benchmark-results.json
```

### Analyze

Analyze a performance report file:

```bash
npx rest-spec-profiler analyze <file> [options]
```

**Options:**

- `-f, --format <type>` - Output format: console, html (default: console)

**Example:**

```bash
# Analyze existing report
npx rest-spec-profiler analyze performance-report.json

# Generate HTML report
npx rest-spec-profiler analyze performance-report.json -f html
```

## Programmatic Usage

### Performance Monitor

```javascript
const { PerformanceMonitor } = require('rest-spec/scripts/performance-profiler');

const monitor = new PerformanceMonitor({
  sampleInterval: 1000,
  maxSamples: 1000,
  enableGC: true
});

// Start monitoring
monitor.start();

// Time an operation
monitor.startTimer('database-query');
await database.query('SELECT * FROM users');
const metrics = monitor.endTimer('database-query');

console.log(`Query took: ${metrics.duration}ms`);
console.log(`Memory delta: ${metrics.memory.delta.heapUsed} bytes`);

// Stop monitoring and get report
monitor.stop();
const report = monitor.getReport();
await monitor.exportReport('./performance-report.json');
```

### CPU Profiler

```javascript
const { CPUProfiler } = require('rest-spec/scripts/performance-profiler');

const profiler = new CPUProfiler();

// Profile for 10 seconds
profiler.start(10000, 100); // duration, interval

// Profiler stops automatically
setTimeout(() => {
  const report = profiler.getReport();
  console.log('CPU Usage:', report.summary.avgCPU);
}, 11000);
```

### Memory Leak Detector

```javascript
const { MemoryLeakDetector } = require('rest-spec/scripts/performance-profiler');

const detector = new MemoryLeakDetector({
  interval: 5000,
  threshold: 50 * 1024 * 1024, // 50MB threshold
  forceGC: true
});

detector.start();

// Run your application...
// Detector will automatically warn about potential leaks

setTimeout(() => {
  detector.stop();
  const report = detector.getReport();
  console.log('Memory growth:', report.summary.memoryGrowth);
}, 60000);
```

### Request Analyzer

```javascript
const { RequestAnalyzer } = require('rest-spec/scripts/performance-profiler');

const analyzer = new RequestAnalyzer();
analyzer.start();

// In your Express middleware
app.use((req, res, next) => {
  const start = performance.now();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    const endMemory = process.memoryUsage();
    
    analyzer.recordRequest(req, res, duration, {
      start: startMemory,
      end: endMemory
    });
  });
  
  next();
});

// Get analysis report
setTimeout(() => {
  const report = analyzer.getReport();
  console.log('Slowest requests:', report.summary.slowestRequests);
}, 60000);
```

## Express Middleware

### Basic Setup

```javascript
const { createPerformanceMiddleware } = require('rest-spec/scripts/performance-profiler');

app.use(createPerformanceMiddleware({
  slowRequestThreshold: 1000,  // Log slow requests > 1000ms
  enableGC: true,              // Enable garbage collection monitoring
  outputFile: './perf.json',   // Auto-save reports
  sampleInterval: 1000,        // Memory sampling interval
  maxSamples: 1000            // Maximum memory samples
}));
```

### Advanced Configuration

```javascript
const performanceMiddleware = createPerformanceMiddleware({
  slowRequestThreshold: 500,
  enableGC: true,
  sampleInterval: 500,
  maxSamples: 2000,
  outputFile: './logs/performance.json',
  
  // Custom request filter
  shouldMonitor: (req) => {
    return req.path.startsWith('/api/');
  },
  
  // Custom slow request handler
  onSlowRequest: (req, res, metrics) => {
    console.warn(`Slow ${req.method} ${req.path}: ${metrics.duration}ms`);
    
    // Send to monitoring service
    if (metrics.duration > 5000) {
      alertingService.sendAlert({
        type: 'slow_request',
        path: req.path,
        duration: metrics.duration
      });
    }
  }
});

app.use(performanceMiddleware);
```

## Performance Metrics

### Memory Metrics

- **RSS**: Resident Set Size - total memory allocated
- **Heap Used**: Memory used by JavaScript objects
- **Heap Total**: Total heap memory allocated
- **External**: Memory used by C++ objects bound to JavaScript

### CPU Metrics

- **User CPU**: Time spent executing user code
- **System CPU**: Time spent executing system calls
- **CPU Usage**: Percentage of CPU time used

### Request Metrics

- **Response Time**: Time from request start to response end
- **Memory Usage**: Memory consumed during request processing
- **Status Code Distribution**: Breakdown of HTTP status codes
- **Request Method Distribution**: Breakdown by HTTP method

## Report Formats

### JSON Report Structure

```json
{
  "summary": {
    "totalDuration": 60000,
    "totalSamples": 60,
    "metricsCount": 42,
    "avgMemory": {
      "rss": 45678912,
      "heapUsed": 23456789,
      "heapTotal": 34567890,
      "external": 1234567
    },
    "peakMemory": {
      "rss": 67890123,
      "heapUsed": 45678901,
      "heapTotal": 56789012,
      "external": 2345678
    }
  },
  "metrics": [
    {
      "name": "database-query",
      "duration": 245.67,
      "memory": {
        "start": { "heapUsed": 12345678 },
        "end": { "heapUsed": 12456789 },
        "delta": { "heapUsed": 111111 }
      },
      "timestamp": "2023-12-07T10:30:00.000Z"
    }
  ],
  "memorySnapshots": [
    {
      "timestamp": "2023-12-07T10:30:00.000Z",
      "memory": {
        "rss": 45678912,
        "heapUsed": 23456789,
        "heapTotal": 34567890,
        "external": 1234567
      },
      "cpu": {
        "user": 1234567,
        "system": 234567
      },
      "uptime": 3600.5
    }
  ]
}
```

### Console Report

```
============================================================
PERFORMANCE REPORT
============================================================

Summary:
  Total Duration: 1.00m
  Total Samples: 60
  Metrics Count: 42
  Avg Memory: 22.37MB
  Peak Memory: 43.56MB

Slowest Operations:
  1. database-query: 245.67ms
  2. api-call: 198.23ms
  3. file-processing: 156.78ms
  4. validation: 89.45ms
  5. auth-check: 67.89ms

============================================================
```

## Best Practices

### Monitoring in Production

1. **Use Sampling**: Don't monitor every request in high-traffic applications
2. **Set Thresholds**: Configure appropriate slow request thresholds
3. **Limit Data**: Set maximum samples to prevent memory issues
4. **Async Reporting**: Export reports asynchronously to avoid blocking

```javascript
// Production configuration
const productionConfig = {
  slowRequestThreshold: 1000,
  sampleInterval: 5000,     // Sample less frequently
  maxSamples: 500,          // Limit memory usage
  enableGC: false,          // Disable in production
  
  // Sample only 10% of requests
  shouldMonitor: (req) => Math.random() < 0.1
};
```

### Development Optimization

1. **Monitor Everything**: Use lower thresholds and higher sampling rates
2. **Enable GC**: Track garbage collection performance
3. **Detailed Reports**: Generate comprehensive reports for analysis

```javascript
// Development configuration
const developmentConfig = {
  slowRequestThreshold: 100,  // Lower threshold
  sampleInterval: 1000,       // Higher frequency
  maxSamples: 2000,          // More samples
  enableGC: true,            // Track GC
  outputFile: './dev-perf.json'
};
```

### Memory Leak Prevention

1. **Regular Monitoring**: Run leak detector periodically
2. **Set Alerts**: Configure alerts for memory growth
3. **Force GC**: Use garbage collection for accurate measurements

```javascript
const leakDetector = new MemoryLeakDetector({
  interval: 10000,           // Check every 10 seconds
  threshold: 100 * 1024 * 1024, // 100MB threshold
  forceGC: true,             // Force GC before measurement
  
  onLeak: (growth) => {
    console.error(`Memory leak detected: ${growth}MB`);
    alertingService.sendAlert('memory_leak', { growth });
  }
});
```

## Integration Examples

### Express + MongoDB

```javascript
const express = require('express');
const mongoose = require('mongoose');
const { 
  createPerformanceMiddleware, 
  PerformanceMonitor 
} = require('rest-spec/scripts/performance-profiler');

const app = express();
const monitor = new PerformanceMonitor();

// Performance monitoring middleware
app.use(createPerformanceMiddleware({
  slowRequestThreshold: 500,
  outputFile: './logs/api-performance.json'
}));

// Database performance monitoring
mongoose.plugin((schema) => {
  schema.pre(/^find/, function() {
    monitor.startTimer(`db-${this.getQuery()._id || 'query'}`);
  });
  
  schema.post(/^find/, function() {
    monitor.endTimer(`db-${this.getQuery()._id || 'query'}`);
  });
});

// Start monitoring
monitor.start();

// Export reports every hour
setInterval(async () => {
  await monitor.exportReport(`./logs/hourly-${Date.now()}.json`);
}, 3600000);
```

### Microservice Performance

```javascript
const { PerformanceMonitor, RequestAnalyzer } = require('rest-spec/scripts/performance-profiler');

class MicroserviceMonitor {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.monitor = new PerformanceMonitor();
    this.analyzer = new RequestAnalyzer();
  }

  start() {
    this.monitor.start();
    this.analyzer.start();
    
    // Report every 5 minutes
    this.reportInterval = setInterval(() => {
      this.generateReport();
    }, 300000);
  }

  async generateReport() {
    const perfReport = this.monitor.getReport();
    const reqReport = this.analyzer.getReport();
    
    const report = {
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      performance: perfReport,
      requests: reqReport
    };
    
    // Send to monitoring service
    await this.sendToMonitoring(report);
  }

  async sendToMonitoring(report) {
    // Implementation depends on your monitoring service
    // e.g., send to Prometheus, DataDog, etc.
  }
}

// Usage
const serviceMonitor = new MicroserviceMonitor('user-service');
serviceMonitor.start();
```

### Load Testing Integration

```javascript
const { PerformanceMonitor } = require('rest-spec/scripts/performance-profiler');

async function loadTest() {
  const monitor = new PerformanceMonitor();
  monitor.start();

  // Simulate load
  const requests = [];
  for (let i = 0; i < 100; i++) {
    requests.push(
      fetch('/api/users')
        .then(response => response.json())
    );
  }

  await Promise.all(requests);
  
  monitor.stop();
  const report = monitor.getReport();
  
  console.log('Load test results:');
  console.log(`Peak memory: ${report.summary.peakMemory.heapUsed / 1024 / 1024}MB`);
  console.log(`Avg memory: ${report.summary.avgMemory.heapUsed / 1024 / 1024}MB`);
  
  return report;
}
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Check for memory leaks using the leak detector
2. **Slow Requests**: Use request analyzer to identify bottlenecks
3. **CPU Spikes**: Run CPU profiler to identify expensive operations
4. **GC Issues**: Monitor garbage collection patterns

### Debug Mode

Enable debug logging:

```bash
DEBUG=profiler npx rest-spec-profiler monitor
```

### Performance Impact

The profiler itself has minimal performance impact:

- Memory overhead: ~1-5MB
- CPU overhead: <1% with default settings
- Request overhead: <1ms per request

### Memory Considerations

- Default settings use ~10MB for storing samples
- Adjust `maxSamples` for memory-constrained environments
- Use `sampleInterval` to reduce memory usage

## License

MIT License - see LICENSE file for details
