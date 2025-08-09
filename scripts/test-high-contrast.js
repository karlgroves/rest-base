#!/usr/bin/env node

/**
 * Test script for high contrast terminal theme support
 *
 * @author Karl Groves
 */

const logger = require("../shared/logger");
const {
  formatSection,
  formatStatus,
  createBox,
  formatProgress,
  formatListItem,
  createSpinner,
  // getThemeInfo,
  printThemeInfo,
} = require("../shared/cli-utils");

async function testColorOutput() {
  console.log(formatSection("High Contrast Theme Test"));

  // Test basic logger methods
  console.log("\nTesting logger methods:");
  logger.info("This is an informational message");
  logger.success("This is a success message");
  logger.warn("This is a warning message");
  logger.error("This is an error message");
  logger.debug("This is a debug message (visible with VERBOSE=true)");
  logger.highlight("This is a highlighted message");
  logger.muted("This is a muted/secondary message");

  // Test label-value pairs
  console.log("\nTesting label-value formatting:");
  logger.labelValue("Node Version", process.version);
  logger.labelValue("Terminal", process.env.TERM || "unknown");
  logger.labelValue("High Contrast", process.env.HIGH_CONTRAST || "not set");

  // Test status indicators
  console.log("\nTesting status indicators:");
  console.log(formatStatus("success", "Operation completed successfully"));
  console.log(formatStatus("error", "Operation failed"));
  console.log(formatStatus("warning", "Operation completed with warnings"));
  console.log(formatStatus("info", "Operation in progress"));

  // Test list formatting
  console.log("\nTesting list formatting:");
  console.log(formatListItem("First item in the list"));
  console.log(formatListItem("Second item in the list"));
  console.log(formatListItem("Third item in the list"));

  // Test progress indicator
  console.log("\nTesting progress indicator:");
  console.log(formatProgress("Processing", 25, 100));
  console.log(formatProgress("Processing", 50, 100));
  console.log(formatProgress("Processing", 75, 100));
  console.log(formatProgress("Processing", 100, 100));

  // Test box formatting
  console.log("\nTesting box formatting:");
  const boxContent =
    "This content is displayed\ninside a formatted box\nfor emphasis";
  console.log(createBox(boxContent));

  // Test spinner (will run for 2 seconds)
  console.log("\nTesting spinner:");
  const spinner = createSpinner("Loading resources...");
  spinner.start();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  spinner.succeed("Resources loaded successfully");

  // Show theme information
  console.log("\n" + formatSection("Current Theme Information"));
  printThemeInfo();
}

async function runComparison() {
  console.log(formatSection("Running Theme Comparison"));

  console.log("\n1. Standard theme output:");
  delete process.env.HIGH_CONTRAST;
  delete process.env.FORCE_HIGH_CONTRAST;

  // Refresh logger theme
  logger.refreshTheme();

  logger.info("Standard theme info message");
  logger.success("Standard theme success message");
  logger.error("Standard theme error message");

  console.log("\n2. High contrast theme output:");
  process.env.HIGH_CONTRAST = "true";

  // Refresh logger theme
  logger.refreshTheme();

  logger.info("High contrast theme info message");
  logger.success("High contrast theme success message");
  logger.error("High contrast theme error message");

  console.log("\n3. No color output (NO_COLOR=1):");
  process.env.NO_COLOR = "1";
  delete process.env.HIGH_CONTRAST;

  // Refresh logger theme
  logger.refreshTheme();

  logger.info("No color theme info message");
  logger.success("No color theme success message");
  logger.error("No color theme error message");

  // Reset environment
  delete process.env.NO_COLOR;
  delete process.env.HIGH_CONTRAST;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "compare":
      await runComparison();
      break;

    case "high-contrast":
      process.env.HIGH_CONTRAST = "true";
      await testColorOutput();
      break;

    case "no-color":
      process.env.NO_COLOR = "1";
      await testColorOutput();
      break;

    default:
      await testColorOutput();
      console.log("\nUsage:");
      console.log(
        "  node test-high-contrast.js              # Test with current settings",
      );
      console.log(
        "  node test-high-contrast.js compare      # Compare all themes",
      );
      console.log(
        "  node test-high-contrast.js high-contrast # Force high contrast mode",
      );
      console.log(
        "  node test-high-contrast.js no-color     # Force no color mode",
      );
      console.log("\nEnvironment variables:");
      console.log("  HIGH_CONTRAST=true    # Enable high contrast mode");
      console.log("  FORCE_HIGH_CONTRAST=true # Force high contrast mode");
      console.log("  NO_COLOR=1            # Disable all colors");
      console.log("  VERBOSE=true          # Show debug messages");
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error("Test failed", error);
    process.exit(1);
  });
}
