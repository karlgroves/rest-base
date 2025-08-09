#!/usr/bin/env node

/**
 * Error Dashboard Generator
 *
 * Generates error reports and dashboards for REST-SPEC CLI tools.
 *
 * @author Karl Groves
 */

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const errorReporter = require("../shared/error-reporter");
const logger = require("../shared/logger");
// const { formatSection, formatStatus } = require('../shared/cli-utils');

/**
 * Command line options
 */
const COMMANDS = {
  summary: "Show error summary for current session",
  dashboard: "Generate full error dashboard",
  recent: "Show recent errors",
  export: "Export error reports to file",
  clean: "Clean up old error reports",
  analyze: "Analyze error patterns",
};

/**
 * Shows error summary
 */
async function showSummary() {
  const summary = errorReporter.getErrorSummary();

  logger.heading("Error Summary");
  logger.labelValue("Session ID", summary.sessionId);
  logger.labelValue("Total Errors", summary.totalErrors.toString());

  if (summary.totalErrors === 0) {
    logger.success("No errors reported in this session");
    return;
  }

  logger.subheading("Errors by Category:");
  for (const [category, count] of Object.entries(summary.errorsByCategory)) {
    logger.labelValue(`  ${category}`, count.toString());
  }

  if (summary.topErrors.length > 0) {
    logger.subheading("Top Errors:");
    summary.topErrors.forEach((error, index) => {
      console.log(
        `  ${index + 1}. ${error.error} (${error.count} occurrences)`,
      );
    });
  }
}

/**
 * Shows recent errors
 */
async function showRecentErrors() {
  const errors = await errorReporter.getRecentErrors();

  logger.heading("Recent Errors");

  if (errors.length === 0) {
    logger.info("No recent errors found");
    return;
  }

  for (const error of errors.slice(0, 10)) {
    console.log();
    logger.subheading(`${error.timestamp} - ${error.category}`);
    logger.labelValue("Severity", error.severity);
    logger.labelValue("Command", error.command);
    logger.labelValue("Message", error.message);
    logger.labelValue("Error ID", error.id);

    if (error.code) {
      logger.labelValue("Code", error.code);
    }

    if (process.env.VERBOSE === "true" && error.context) {
      logger.muted("Context:");
      console.log(JSON.stringify(error.context, null, 2));
    }
  }

  if (errors.length > 10) {
    logger.info(
      `\nShowing 10 of ${errors.length} errors. Use --export to see all.`,
    );
  }
}

/**
 * Generates full dashboard
 */
async function generateDashboard() {
  logger.heading("Generating Error Dashboard...");

  const dashboard = await errorReporter.generateDashboard();

  console.log();
  console.log(dashboard);
}

/**
 * Exports error reports
 * @param {string} filename - Output filename
 */
async function exportReports(filename) {
  logger.heading("Exporting Error Reports...");

  const errors = await errorReporter.getRecentErrors();
  const summary = errorReporter.getErrorSummary();

  const report = {
    generated: new Date().toISOString(),
    summary,
    errors,
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      restSpecVersion: require("../package.json").version,
    },
  };

  const outputPath = path.resolve(filename);

  try {
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
    logger.success(`Error report exported to: ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to export report: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Cleans up old error reports
 */
async function cleanupReports() {
  logger.heading("Cleaning Up Error Reports...");

  const errorLogPath = path.join(os.tmpdir(), "rest-spec-errors");

  try {
    const files = await fs.readdir(errorLogPath);
    const errorFiles = files.filter(
      (f) => f.startsWith("error-") && f.endsWith(".json"),
    );

    if (errorFiles.length === 0) {
      logger.info("No error reports to clean up");
      return;
    }

    // Keep last 50 files
    const toDelete = errorFiles
      .map((f) => ({
        name: f,
        path: path.join(errorLogPath, f),
        time: parseInt(f.match(/error-.*-(\d+)\.json/)?.[1] || 0),
      }))
      .sort((a, b) => b.time - a.time)
      .slice(50);

    if (toDelete.length === 0) {
      logger.info("No old error reports to remove");
      return;
    }

    await Promise.all(toDelete.map((f) => fs.unlink(f.path)));
    logger.success(`Removed ${toDelete.length} old error reports`);
  } catch (error) {
    logger.error(`Failed to clean up reports: ${error.message}`);
  }
}

/**
 * Analyzes error patterns
 */
async function analyzePatterns() {
  logger.heading("Analyzing Error Patterns...");

  const errors = await errorReporter.getRecentErrors();

  if (errors.length === 0) {
    logger.info("No errors to analyze");
    return;
  }

  // Time-based analysis
  const hourlyDistribution = new Map();
  const commandErrors = new Map();
  const categoryTrends = new Map();

  errors.forEach((error) => {
    const hour = new Date(error.timestamp).getHours();
    hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);

    commandErrors.set(
      error.command,
      (commandErrors.get(error.command) || 0) + 1,
    );

    const day = new Date(error.timestamp).toDateString();
    if (!categoryTrends.has(day)) {
      categoryTrends.set(day, new Map());
    }
    const dayMap = categoryTrends.get(day);
    dayMap.set(error.category, (dayMap.get(error.category) || 0) + 1);
  });

  // Display analysis
  logger.subheading("Commands with Most Errors:");
  const sortedCommands = Array.from(commandErrors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  sortedCommands.forEach(([command, count]) => {
    logger.labelValue(`  ${command}`, `${count} errors`);
  });

  logger.subheading("\nError Distribution by Hour:");
  const peakHours = Array.from(hourlyDistribution.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  peakHours.forEach(([hour, count]) => {
    logger.labelValue(`  ${hour}:00-${hour}:59`, `${count} errors`);
  });

  logger.subheading("\nError Trends (Last 7 Days):");
  const recentDays = Array.from(categoryTrends.entries())
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .slice(0, 7);

  recentDays.forEach(([day, categories]) => {
    const total = Array.from(categories.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    logger.labelValue(`  ${day}`, `${total} errors`);
  });

  // Recommendations
  logger.subheading("\nRecommendations:");

  if (sortedCommands[0] && sortedCommands[0][1] > errors.length * 0.3) {
    logger.warn(
      `- The '${sortedCommands[0][0]}' command accounts for over 30% of errors. Consider reviewing its implementation.`,
    );
  }

  const userErrors = errors.filter((e) => e.category === "USER_ERROR").length;
  if (userErrors > errors.length * 0.5) {
    logger.warn(
      "- Over 50% of errors are user errors. Consider improving documentation or error messages.",
    );
  }

  const criticalErrors = errors.filter((e) => e.severity === "CRITICAL").length;
  if (criticalErrors > 0) {
    logger.error(
      `- Found ${criticalErrors} critical errors that need immediate attention.`,
    );
  }
}

/**
 * Shows help information
 */
function showHelp() {
  logger.heading("REST-SPEC Error Dashboard");
  console.log("Usage: node error-dashboard.js [command] [options]");
  console.log();
  logger.subheading("Commands:");

  for (const [command, description] of Object.entries(COMMANDS)) {
    console.log(`  ${command.padEnd(12)} ${description}`);
  }

  console.log();
  logger.subheading("Options:");
  console.log("  --verbose    Show detailed error information");
  console.log("  --help       Show this help message");

  console.log();
  logger.subheading("Examples:");
  console.log("  node error-dashboard.js summary");
  console.log("  node error-dashboard.js export errors.json");
  console.log("  node error-dashboard.js analyze --verbose");
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "summary";

  if (args.includes("--help") || command === "help") {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--verbose")) {
    process.env.VERBOSE = "true";
  }

  try {
    switch (command) {
      case "summary":
        await showSummary();
        break;

      case "dashboard":
        await generateDashboard();
        break;

      case "recent":
        await showRecentErrors();
        break;

      case "export": {
        const filename = args[1] || "error-report.json";
        await exportReports(filename);
        break;
      }

      case "clean":
        await cleanupReports();
        break;

      case "analyze":
        await analyzePatterns();
        break;

      default:
        logger.error(`Unknown command: ${command}`);
        console.log("Use --help to see available commands");
        process.exit(1);
    }
  } catch (error) {
    await errorReporter.report(error, {
      command: "error-dashboard",
      context: { command, args },
    });
    logger.error(`Failed to execute ${command}: ${error.message}`);
    process.exit(1);
  }
}

// Execute main
main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
