#!/usr/bin/env node

/**
 * REST-SPEC Benchmark Suite
 *
 * Main entry point for running all performance benchmarks.
 * Provides options to run specific suites or compare results.
 *
 * @author Karl Groves
 */

const path = require("path");
const fs = require("fs").promises;
const { program } = require("commander");
const { compareBenchmarks } = require("./benchmark-runner");
const { runAllBenchmarks: runCliBenchmarks } = require("./cli-benchmarks");
const { runAllBenchmarks: runApiBenchmarks } = require("./api-benchmarks");
const logger = require("../shared/logger");

/**
 * Load benchmark results from file
 */
async function loadResults(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Failed to load results from ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Compare benchmark results
 */
async function compareResults(baselinePath, currentPath) {
  const baseline = await loadResults(baselinePath);
  const current = await loadResults(currentPath);

  if (!baseline || !current) {
    throw new Error("Failed to load benchmark results for comparison");
  }

  const comparison = compareBenchmarks(baseline, current);

  // Display comparison
  logger.heading("Benchmark Comparison Results");
  console.log(`Baseline: ${baselinePath}`);
  console.log(`Current: ${currentPath}`);
  console.log();

  for (const bench of comparison.benchmarks) {
    console.log(`\n${bench.name}:`);

    // Execution time
    const execChange = bench.executionTime.changePercent;
    const execStatus = bench.status.executionTime;
    const execSymbol =
      execStatus === "improved"
        ? "✅"
        : execStatus === "degraded"
          ? "❌"
          : "➖";

    console.log(
      `  Execution Time: ${execSymbol} ${execChange > 0 ? "+" : ""}${execChange.toFixed(2)}%`,
    );
    console.log(`    Baseline: ${bench.executionTime.baseline.toFixed(2)}ms`);
    console.log(`    Current: ${bench.executionTime.current.toFixed(2)}ms`);

    // Memory usage
    const memChange = bench.memory.changePercent;
    const memStatus = bench.status.memory;
    const memSymbol =
      memStatus === "improved" ? "✅" : memStatus === "degraded" ? "❌" : "➖";

    console.log(
      `  Memory Usage: ${memSymbol} ${memChange > 0 ? "+" : ""}${memChange.toFixed(2)}%`,
    );
    console.log(
      `    Baseline: ${(bench.memory.baseline / 1024 / 1024).toFixed(2)}MB`,
    );
    console.log(
      `    Current: ${(bench.memory.current / 1024 / 1024).toFixed(2)}MB`,
    );

    // Throughput
    const throughputChange = bench.throughput.changePercent;
    const throughputStatus = bench.status.throughput;
    const throughputSymbol =
      throughputStatus === "improved"
        ? "✅"
        : throughputStatus === "degraded"
          ? "❌"
          : "➖";

    console.log(
      `  Throughput: ${throughputSymbol} ${throughputChange > 0 ? "+" : ""}${throughputChange.toFixed(2)}%`,
    );
    console.log(
      `    Baseline: ${bench.throughput.baseline.toFixed(2)} ops/sec`,
    );
    console.log(`    Current: ${bench.throughput.current.toFixed(2)} ops/sec`);
  }

  // Save comparison results
  const outputPath = "benchmarks/results/comparison.json";
  await fs.writeFile(outputPath, JSON.stringify(comparison, null, 2));
  console.log(`\nComparison results saved to: ${outputPath}`);
}

/**
 * Run specific benchmark suite
 */
async function runSuite(suiteName) {
  switch (suiteName) {
    case "cli":
      await runCliBenchmarks();
      break;
    case "api":
      await runApiBenchmarks();
      break;
    case "all":
      await runCliBenchmarks();
      console.log("\n" + "=".repeat(80) + "\n");
      await runApiBenchmarks();
      break;
    default:
      logger.error(`Unknown suite: ${suiteName}`);
      console.log("Available suites: cli, api, all");
      process.exit(1);
  }
}

/**
 * List available benchmark results
 */
async function listResults() {
  const resultsDir = "benchmarks/results";

  try {
    await fs.mkdir(resultsDir, { recursive: true });
    const files = await fs.readdir(resultsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    if (jsonFiles.length === 0) {
      console.log("No benchmark results found.");
      console.log("Run benchmarks first with: npm run benchmark");
      return;
    }

    logger.heading("Available Benchmark Results");
    for (const file of jsonFiles) {
      const stats = await fs.stat(path.join(resultsDir, file));
      console.log(`  ${file} - ${stats.mtime.toLocaleString()}`);
    }
  } catch (error) {
    logger.error(`Failed to list results: ${error.message}`);
  }
}

/**
 * Clean old benchmark results
 */
async function cleanResults(keepDays = 7) {
  const resultsDir = "benchmarks/results";
  const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(resultsDir);
    let cleaned = 0;

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const filePath = path.join(resultsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime.getTime() < cutoffTime) {
        await fs.unlink(filePath);
        cleaned++;
        logger.info(`Removed old result: ${file}`);
      }
    }

    if (cleaned > 0) {
      logger.success(`Cleaned ${cleaned} old benchmark result(s)`);
    } else {
      logger.info("No old results to clean");
    }
  } catch (error) {
    logger.error(`Failed to clean results: ${error.message}`);
  }
}

// CLI setup
program
  .name("rest-spec-benchmark")
  .description("REST-SPEC Performance Benchmark Suite")
  .version("1.0.0");

program
  .command("run [suite]")
  .description("Run benchmark suite (cli, api, or all)")
  .option("-i, --iterations <number>", "Number of iterations", parseInt)
  .option("-w, --warmup <number>", "Number of warmup runs", parseInt)
  .option("-o, --output <path>", "Output file path")
  .action(async (suite = "all", _options) => {
    try {
      // TODO: Pass options to benchmark suites
      await runSuite(suite);
    } catch (error) {
      logger.error(`Benchmark failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("compare <baseline> <current>")
  .description("Compare two benchmark results")
  .action(async (baseline, current) => {
    try {
      await compareResults(baseline, current);
    } catch (error) {
      logger.error(`Comparison failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List available benchmark results")
  .action(listResults);

program
  .command("clean")
  .description("Clean old benchmark results")
  .option("-d, --days <number>", "Keep results from last N days", parseInt, 7)
  .action(async (options) => {
    await cleanResults(options.days);
  });

// Add to package.json scripts
program
  .command("init")
  .description("Add benchmark scripts to package.json")
  .action(async () => {
    try {
      const packagePath = path.join(process.cwd(), "package.json");
      const packageData = JSON.parse(await fs.readFile(packagePath, "utf8"));

      if (!packageData.scripts) {
        packageData.scripts = {};
      }

      // Add benchmark scripts
      const benchmarkScripts = {
        benchmark: "node benchmarks/index.js run all",
        "benchmark:cli": "node benchmarks/index.js run cli",
        "benchmark:api": "node benchmarks/index.js run api",
        "benchmark:compare": "node benchmarks/index.js compare",
        "benchmark:list": "node benchmarks/index.js list",
        "benchmark:clean": "node benchmarks/index.js clean",
      };

      Object.assign(packageData.scripts, benchmarkScripts);

      await fs.writeFile(
        packagePath,
        JSON.stringify(packageData, null, 2) + "\n",
      );
      logger.success("Benchmark scripts added to package.json");

      console.log("\nAvailable commands:");
      console.log("  npm run benchmark         - Run all benchmarks");
      console.log("  npm run benchmark:cli     - Run CLI benchmarks only");
      console.log("  npm run benchmark:api     - Run API benchmarks only");
      console.log("  npm run benchmark:list    - List available results");
      console.log("  npm run benchmark:clean   - Clean old results");
    } catch (error) {
      logger.error(`Failed to update package.json: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
