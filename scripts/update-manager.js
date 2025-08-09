#!/usr/bin/env node

/**
 * Update Manager CLI with high contrast support
 *
 * Manages update checking for REST-SPEC
 * @author Karl Groves
 */

const UpdateChecker = require("../shared/update-checker");
const logger = require("../shared/logger");
const { formatSection } = require("../shared/cli-utils");

function showHelp() {
  console.log(formatSection("REST-SPEC Update Manager"));
  console.log("\nUsage: rest-spec-update [command]\n");
  console.log("Commands:");
  console.log("  check           Check for updates now");
  console.log("  disable         Disable automatic update checking");
  console.log("  enable          Enable automatic update checking");
  console.log("  status          Show update checking status");
  console.log("  help            Show this help message");
  console.log("\nExamples:");
  console.log("  rest-spec-update check          # Check for updates now");
  console.log("  rest-spec-update disable        # Disable auto-updates");
  console.log("  rest-spec-update status         # Show current status");
  console.log();
}

async function checkUpdates() {
  const updateChecker = new UpdateChecker();

  logger.info("Checking for updates...");

  const updateAvailable = await updateChecker.checkForUpdates(true);

  if (!updateAvailable) {
    const currentVersion = await updateChecker.getCurrentVersion();
    logger.success(`You are using the latest version (${currentVersion})`);
  }
}

async function disableUpdates() {
  const updateChecker = new UpdateChecker();

  const success = await updateChecker.disableUpdateChecking();

  if (success) {
    logger.success("Automatic update checking has been disabled");
    logger.info("You can re-enable it with: rest-spec-update enable");
  } else {
    logger.error("Failed to disable update checking");
  }
}

async function enableUpdates() {
  const fs = require("fs").promises;
  const path = require("path");

  const disableFile = path.join(__dirname, "..", ".no-update-check");

  try {
    await fs.unlink(disableFile);
    logger.success("Automatic update checking has been enabled");
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.info("Automatic update checking is already enabled");
    } else {
      logger.error("Failed to enable update checking", error);
    }
  }
}

async function showStatus() {
  const updateChecker = new UpdateChecker();

  const disabled = await updateChecker.isUpdateCheckingDisabled();
  const currentVersion = await updateChecker.getCurrentVersion();

  console.log(formatSection("REST-SPEC Update Status"));
  logger.labelValue("Current version", currentVersion);
  logger.labelValue(
    "Automatic update checking",
    disabled ? "Disabled" : "Enabled",
  );

  if (disabled) {
    console.log();
    logger.highlight(
      "Tip: Enable automatic updates with: rest-spec-update enable",
    );
  } else {
    console.log();
    logger.muted(
      "Tip: Disable automatic updates with: rest-spec-update disable",
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "check":
      await checkUpdates();
      break;

    case "disable":
      await disableUpdates();
      break;

    case "enable":
      await enableUpdates();
      break;

    case "status":
      await showStatus();
      break;

    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;

    case "theme": {
      // Hidden command to show theme info for debugging
      const { printThemeInfo } = require("../shared/cli-utils");
      printThemeInfo();
      break;
    }

    default:
      if (command) {
        logger.error(`Unknown command: ${command}`);
      }
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(`${error.message}`, error);
    process.exit(1);
  });
}

module.exports = { main };
