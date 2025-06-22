#!/usr/bin/env node

/**
 * Update Manager CLI
 *
 * Manages update checking for REST-SPEC
 * @author Karl Groves
 */

const UpdateChecker = require("../shared/update-checker");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function showHelp() {
  console.log(`
${colors.blue}REST-SPEC Update Manager${colors.reset}

Usage: rest-spec-update [command]

Commands:
  check           Check for updates now
  disable         Disable automatic update checking
  enable          Enable automatic update checking
  status          Show update checking status
  help            Show this help message

Examples:
  rest-spec-update check          # Check for updates now
  rest-spec-update disable        # Disable auto-updates
  rest-spec-update status         # Show current status
`);
}

async function checkUpdates() {
  const updateChecker = new UpdateChecker();

  log("Checking for updates...", colors.cyan);

  const updateAvailable = await updateChecker.checkForUpdates(true);

  if (!updateAvailable) {
    const currentVersion = await updateChecker.getCurrentVersion();
    log(
      `Success: You are using the latest version (${currentVersion})`,
      colors.green,
    );
  }
}

async function disableUpdates() {
  const updateChecker = new UpdateChecker();

  const success = await updateChecker.disableUpdateChecking();

  if (success) {
    log("Success: Automatic update checking has been disabled", colors.green);
    log("You can re-enable it with: rest-spec-update enable", colors.yellow);
  } else {
    log("Error: Failed to disable update checking", colors.red);
  }
}

async function enableUpdates() {
  const fs = require("fs").promises;
  const path = require("path");

  const disableFile = path.join(__dirname, "..", ".no-update-check");

  try {
    await fs.unlink(disableFile);
    log("Success: Automatic update checking has been enabled", colors.green);
  } catch (error) {
    if (error.code === "ENOENT") {
      log("Information: Automatic update checking is already enabled", colors.green);
    } else {
      log("Error: Failed to enable update checking", colors.red);
    }
  }
}

async function showStatus() {
  const updateChecker = new UpdateChecker();

  const disabled = await updateChecker.isUpdateCheckingDisabled();
  const currentVersion = await updateChecker.getCurrentVersion();

  log(`${colors.blue}REST-SPEC Update Status${colors.reset}`);
  log("Status Information Below");
  log(`Current version: ${currentVersion}`);
  log(`Auto-check enabled: ${disabled ? "No" : "Yes"}`);

  if (disabled) {
    log(
      'Run "rest-spec-update enable" to enable automatic checking',
      colors.yellow,
    );
  } else {
    log(
      'Run "rest-spec-update disable" to disable automatic checking',
      colors.yellow,
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

    default:
      if (command) {
        log(`Unknown command: ${command}`, colors.red);
      }
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { main };
