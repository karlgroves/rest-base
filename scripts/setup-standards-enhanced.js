#!/usr/bin/env node

/**
 * Enhanced REST-Base Standards Setup Script
 *
 * This script helps incorporate REST-Base standards into a Node.js project.
 * Includes dry-run mode, interactive mode, config file support, and rollback functionality.
 *
 * @author REST-Base Team
 */

const { EnhancedCLI } = require("./cli-enhancements");

// Create enhanced CLI instance
const cli = new EnhancedCLI();

// Main function that wraps the original setup-standards functionality
async function enhancedSetupStandards(context) {
  const { options, args, dryRun, interactive, rollback } = context;

  // Get target directory
  let targetDir = args[0] || process.cwd();

  if (interactive && !args[0]) {
    const currentDir = process.cwd();
    const useCurrentDir = await interactive.confirm(
      `Use current directory (${currentDir})?`,
    );

    if (!useCurrentDir) {
      targetDir = await interactive.prompt("Enter target directory:");
    }
  }

  // Validate target directory
  if (!targetDir) {
    console.error("Please provide a target directory");
    console.log("Usage: rest-base-setup-enhanced [target-directory] [options]");
    process.exit(1);
  }

  // Interactive mode confirmations
  if (interactive) {
    const operations = [];

    if (!options["skip-docs"]) {
      operations.push("Copy REST-Base documentation files");
    }

    if (!options["skip-config"]) {
      operations.push(
        "Copy configuration files (.eslintrc.js, .gitignore, etc.)",
      );
    }

    if (!options["skip-deps"]) {
      operations.push("Install development dependencies");
    }

    console.log("\nThe following operations will be performed:");
    operations.forEach((op, index) => {
      console.log(`  ${index + 1}. ${op}`);
    });

    const proceed = await interactive.confirm("\nProceed with setup?");
    if (!proceed) {
      console.log("Setup cancelled.");
      process.exit(0);
    }
  }

  // Prepare enhanced arguments for original setup-standards
  const enhancedArgs = [targetDir];

  // Add original flags
  if (options["skip-docs"]) enhancedArgs.push("--skip-docs");
  if (options["skip-config"]) enhancedArgs.push("--skip-config");
  if (options["skip-deps"]) enhancedArgs.push("--skip-deps");
  if (options["force"]) enhancedArgs.push("--force");

  // Run setup with enhancements
  process.argv = ["node", "setup-standards.js", ...enhancedArgs];

  // If dry-run mode, intercept operations
  if (dryRun) {
    await simulateSetupStandards(context, targetDir);
  } else {
    // Create rollback point if requested
    if (rollback && !options["skip-backup"]) {
      await rollback.createBackup(targetDir, "pre-setup");
    }

    try {
      // Run actual setup
      await require("./setup-standards");

      if (rollback) {
        console.log(
          "✓ Setup completed successfully. Backup created for rollback if needed.",
        );
      }
    } catch (error) {
      if (rollback && !options["skip-backup"]) {
        console.log("Setup failed. Attempting rollback...");
        await rollback.restoreBackup(targetDir, "pre-setup");
        console.log("Rollback completed.");
      }
      throw error;
    }
  }
}

/**
 * Simulate setup standards in dry-run mode
 */
async function simulateSetupStandards(context, targetDir) {
  const { dryRun, options } = context;

  // Record operations that would be performed
  dryRun.recordOperation("validate", `Validate target directory: ${targetDir}`);

  if (!options["skip-docs"]) {
    dryRun.recordOperation("copy", "Copy REST-Base documentation files", {
      files: [
        "node_structure_and_naming_conventions.md",
        "sql-standards-and-patterns.md",
        "technologies.md",
        "operations-and-responses.md",
        "request.md",
        "validation.md",
        "global-rules.md",
        "CLAUDE.md",
      ],
    });
  }

  if (!options["skip-config"]) {
    dryRun.recordOperation("copy", "Copy configuration files", {
      files: [".markdownlint.json", ".gitignore"],
    });
    dryRun.recordOperation(
      "create",
      "Generate .eslintrc.js with REST-Base configuration",
    );
    dryRun.recordOperation(
      "create",
      "Generate .env.example with standard environment variables",
    );
  }

  if (!options["skip-deps"]) {
    dryRun.recordOperation("install", "Install development dependencies", {
      dependencies: [
        "markdownlint-cli",
        "eslint",
        "eslint-config-airbnb-base",
        "eslint-plugin-import",
      ],
    });
  }

  dryRun.recordOperation(
    "update",
    "Update package.json scripts for linting and formatting",
  );
}

// Run the enhanced CLI
cli.run(enhancedSetupStandards);
