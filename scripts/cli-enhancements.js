#!/usr/bin/env node

/**
 * CLI Enhancement Utilities
 *
 * Provides dry-run mode, interactive mode, config file support,
 * rollback functionality, and custom templates for REST-Base CLI tools.
 *
 * @author REST-Base Team
 */

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");
const inquirer = require("inquirer");
const logger = require("../shared/logger");

/**
 * CLI Options Manager
 * Handles parsing and validation of enhanced CLI options
 */
class CLIOptionsManager {
  constructor() {
    this.options = {
      dryRun: false,
      interactive: false,
      configFile: null,
      verbose: false,
      rollback: false,
      template: null,
      backup: true,
      force: false,
    };
  }

  /**
   * Parse command line arguments
   * @param {string[]} args - Command line arguments
   * @returns {Object} Parsed options
   */
  parseArgs(args) {
    const options = { ...this.options };
    const positionalArgs = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--dry-run":
        case "-d":
          options.dryRun = true;
          break;

        case "--interactive":
        case "-i":
          options.interactive = true;
          break;

        case "--config":
        case "-c":
          options.configFile = args[++i];
          break;

        case "--verbose":
        case "-v":
          options.verbose = true;
          break;

        case "--rollback":
        case "-r":
          options.rollback = true;
          break;

        case "--template":
        case "-t":
          options.template = args[++i];
          break;

        case "--no-backup":
          options.backup = false;
          break;

        case "--force":
        case "-f":
          options.force = true;
          break;

        case "--help":
        case "-h":
          this.showHelp();
          process.exit(0);
          break;

        default:
          if (!arg.startsWith("-")) {
            positionalArgs.push(arg);
          }
      }
    }

    return { options, positionalArgs };
  }

  /**
   * Load configuration from file
   * @param {string} configPath - Path to configuration file
   * @returns {Object} Configuration object
   */
  async loadConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, "utf8");
      const config = JSON.parse(configContent);

      // Validate configuration
      this.validateConfig(config);

      return config;
    } catch (error) {
      throw new Error(`Failed to load config file: ${error.message}`);
    }
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   */
  validateConfig(config) {
    const requiredFields = ["name", "version"];

    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new Error(`Missing required config field: ${field}`);
      }
    }
  }

  /**
   * Show help message
   */
  showHelp() {
    console.log(`
${chalk.bold("REST-Base CLI - Enhanced Options")}

${chalk.yellow("Usage:")} rest-base [command] [options]

${chalk.yellow("Options:")}
  -d, --dry-run          Run in dry-run mode (preview changes without applying)
  -i, --interactive      Run in interactive mode (prompt for confirmations)
  -c, --config <file>    Use configuration file
  -v, --verbose          Enable verbose logging
  -r, --rollback         Rollback previous operation
  -t, --template <name>  Use custom template
  --no-backup            Skip creating backups
  -f, --force            Force operation without prompts
  -h, --help             Show this help message

${chalk.yellow("Examples:")}
  rest-base create my-project --dry-run
  rest-base setup --interactive
  rest-base create my-app --template microservice
  rest-base rollback --verbose
    `);
  }
}

/**
 * Dry Run Manager
 * Handles dry-run mode operations
 */
class DryRunManager {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.operations = [];
  }

  /**
   * Record an operation that would be performed
   * @param {string} type - Operation type
   * @param {string} description - Operation description
   * @param {Object} details - Operation details
   */
  recordOperation(type, description, details = {}) {
    this.operations.push({
      type,
      description,
      details,
      timestamp: new Date().toISOString(),
    });

    if (this.verbose) {
      this.logOperation(type, description, details);
    }
  }

  /**
   * Log a single operation
   */
  logOperation(type, description, details) {
    const icon = this.getOperationIcon(type);
    console.log(`${icon} ${chalk.gray("[DRY-RUN]")} ${description}`);

    if (this.verbose && Object.keys(details).length > 0) {
      console.log(chalk.gray("  Details:"), details);
    }
  }

  /**
   * Get icon for operation type
   */
  getOperationIcon(type) {
    const icons = {
      create: "[CREATE]",
      modify: "[MODIFY]",
      delete: "[DELETE]",
      copy: "[COPY]",
      execute: "[EXECUTE]",
      backup: "[BACKUP]",
    };
    return icons[type] || "[ACTION]";
  }

  /**
   * Generate dry-run report
   */
  generateReport() {
    console.log("\n" + chalk.bold.cyan("=== DRY-RUN SUMMARY ==="));
    console.log(chalk.gray(`Total operations: ${this.operations.length}\n`));

    const groupedOps = this.groupOperations();

    for (const [type, ops] of Object.entries(groupedOps)) {
      console.log(
        `${this.getOperationIcon(type)} ${chalk.bold(type.toUpperCase())} (${ops.length} operations)`,
      );

      ops.forEach((op) => {
        console.log(`  - ${op.description}`);
      });
      console.log();
    }

    console.log(
      chalk.yellow(
        "NOTICE: No changes were made. Remove --dry-run to apply these changes.",
      ),
    );
  }

  /**
   * Group operations by type
   */
  groupOperations() {
    return this.operations.reduce((acc, op) => {
      if (!acc[op.type]) {
        acc[op.type] = [];
      }
      acc[op.type].push(op);
      return acc;
    }, {});
  }
}

/**
 * Interactive Mode Manager
 * Handles interactive prompts and confirmations
 */
class InteractiveModeManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Prompt for confirmation
   * @param {string} message - Confirmation message
   * @returns {Promise<boolean>} User's response
   */
  async confirm(message) {
    const response = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message,
        default: true,
      },
    ]);
    return response.confirmed;
  }

  /**
   * Prompt for text input
   * @param {string} message - Prompt message
   * @param {string} defaultValue - Default value
   * @returns {Promise<string>} User's input
   */
  async prompt(message, defaultValue = "") {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message,
        default: defaultValue,
      },
    ]);
    return response.value;
  }

  /**
   * Prompt for selection from list
   * @param {string} message - Prompt message
   * @param {string[]} choices - Available choices
   * @returns {Promise<string>} Selected choice
   */
  async select(message, choices) {
    const response = await inquirer.prompt([
      {
        type: "list",
        name: "selection",
        message,
        choices,
      },
    ]);
    return response.selection;
  }

  /**
   * Prompt for multiple selections
   * @param {string} message - Prompt message
   * @param {Object[]} choices - Available choices with names and values
   * @returns {Promise<string[]>} Selected values
   */
  async multiSelect(message, choices) {
    const response = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selections",
        message,
        choices,
      },
    ]);
    return response.selections;
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }
}

/**
 * Rollback Manager
 * Handles rollback functionality
 */
class RollbackManager {
  constructor(backupDir = ".rest-base-backups") {
    this.backupDir = backupDir;
  }

  /**
   * Create a backup before operation
   * @param {string} projectPath - Project path to backup
   * @param {string} operationType - Type of operation
   * @returns {Promise<string>} Backup ID
   */
  async createBackup(projectPath, operationType) {
    const backupId = this.generateBackupId(operationType);
    const backupPath = path.join(this.backupDir, backupId);

    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true });

    // Save backup metadata
    const metadata = {
      id: backupId,
      timestamp: new Date().toISOString(),
      operationType,
      projectPath,
      files: [],
    };

    // Copy project files
    await this.copyDirectory(projectPath, backupPath, metadata);

    // Save metadata
    await fs.writeFile(
      path.join(backupPath, "backup-metadata.json"),
      JSON.stringify(metadata, null, 2),
    );

    logger.info("Backup created", { backupId, path: backupPath });
    return backupId;
  }

  /**
   * Rollback to a previous state
   * @param {string} backupId - Backup ID to rollback to
   * @returns {Promise<void>}
   */
  async rollback(backupId = null) {
    // If no backup ID provided, show available backups
    if (!backupId) {
      const backups = await this.listBackups();
      if (backups.length === 0) {
        throw new Error("No backups available");
      }

      // In interactive mode, let user select
      const interactive = new InteractiveModeManager();
      const choices = backups.map((b) => ({
        name: `Backup: ${b.id} - Operation: ${b.operationType} - Date: ${new Date(b.timestamp).toLocaleString()}`,
        value: b.id,
      }));

      backupId = await interactive.select(
        "Select backup to rollback to:",
        choices,
      );
      interactive.close();
    }

    // Load backup metadata
    const backupPath = path.join(this.backupDir, backupId);
    const metadataPath = path.join(backupPath, "backup-metadata.json");

    if (!fsSync.existsSync(metadataPath)) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));

    // Perform rollback
    logger.info("Starting rollback", { backupId, to: metadata.projectPath });

    // Create a new backup of current state before rollback
    await this.createBackup(metadata.projectPath, "pre-rollback");

    // Restore files
    await this.restoreFromBackup(backupPath, metadata.projectPath, metadata);

    logger.success("Rollback completed successfully");
  }

  /**
   * List available backups
   * @returns {Promise<Object[]>} List of backups
   */
  async listBackups() {
    if (!fsSync.existsSync(this.backupDir)) {
      return [];
    }

    const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
    const backups = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadataPath = path.join(
          this.backupDir,
          entry.name,
          "backup-metadata.json",
        );
        if (fsSync.existsSync(metadataPath)) {
          const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
          backups.push(metadata);
        }
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  }

  /**
   * Generate backup ID
   */
  generateBackupId(operationType) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${operationType}-${timestamp}`;
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest, metadata) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      // Skip backup directory and node_modules
      if (entry.name === this.backupDir || entry.name === "node_modules") {
        continue;
      }

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, metadata);
      } else {
        await fs.copyFile(srcPath, destPath);
        metadata.files.push(path.relative(src, srcPath));
      }
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath, targetPath, metadata) {
    // Remove existing files
    for (const file of metadata.files) {
      const filePath = path.join(targetPath, file);
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    }

    // Copy backup files
    for (const file of metadata.files) {
      const srcPath = path.join(backupPath, file);
      const destPath = path.join(targetPath, file);

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
    }
  }

  /**
   * Clean up old backups
   * @param {number} daysToKeep - Number of days to keep backups
   */
  async cleanupOldBackups(daysToKeep = 7) {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removedCount = 0;

    for (const backup of backups) {
      if (new Date(backup.timestamp) < cutoffDate) {
        const backupPath = path.join(this.backupDir, backup.id);
        await fs.rm(backupPath, { recursive: true, force: true });
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old backups`);
    }
  }
}

/**
 * Template Manager
 * Handles custom project templates
 */
class TemplateManager {
  constructor(templatesDir = path.join(__dirname, "..", "templates")) {
    this.templatesDir = templatesDir;
    this.builtInTemplates = [
      "default",
      "microservice",
      "api-gateway",
      "graphql",
      "websocket",
    ];
  }

  /**
   * List available templates
   * @returns {Promise<Object[]>} List of templates
   */
  async listTemplates() {
    const templates = [];

    // Add built-in templates
    for (const name of this.builtInTemplates) {
      templates.push({
        name,
        type: "built-in",
        description: this.getTemplateDescription(name),
      });
    }

    // Add custom templates
    if (fsSync.existsSync(this.templatesDir)) {
      const entries = await fs.readdir(this.templatesDir, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (
          entry.isDirectory() &&
          !this.builtInTemplates.includes(entry.name)
        ) {
          const templatePath = path.join(this.templatesDir, entry.name);
          const templateConfig = await this.loadTemplateConfig(templatePath);

          templates.push({
            name: entry.name,
            type: "custom",
            description: templateConfig.description || "Custom template",
            path: templatePath,
          });
        }
      }
    }

    return templates;
  }

  /**
   * Load template configuration
   */
  async loadTemplateConfig(templatePath) {
    const configPath = path.join(templatePath, "template.json");

    if (fsSync.existsSync(configPath)) {
      return JSON.parse(await fs.readFile(configPath, "utf8"));
    }

    return {};
  }

  /**
   * Get template description
   */
  getTemplateDescription(name) {
    const descriptions = {
      default: "Standard REST API with Express.js",
      microservice: "Microservice architecture with message queuing",
      "api-gateway": "API Gateway pattern with rate limiting and caching",
      graphql: "GraphQL API with Apollo Server",
      websocket: "Real-time WebSocket application",
    };

    return descriptions[name] || "Custom template";
  }

  /**
   * Apply template to project
   * @param {string} templateName - Template name
   * @param {string} projectPath - Target project path
   * @param {Object} variables - Template variables
   */
  async applyTemplate(templateName, projectPath, variables = {}) {
    const template = await this.loadTemplate(templateName);

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    logger.info(`Applying template: ${templateName}`);

    // Process template files
    for (const file of template.files) {
      const sourcePath = path.join(template.path, file.src);
      const destPath = path.join(
        projectPath,
        this.processTemplatePath(file.dest, variables),
      );

      // Create directory if needed
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      if (file.template) {
        // Process template file
        const content = await fs.readFile(sourcePath, "utf8");
        const processed = this.processTemplate(content, variables);
        await fs.writeFile(destPath, processed);
      } else {
        // Copy file as-is
        await fs.copyFile(sourcePath, destPath);
      }
    }

    // Run post-install hooks
    if (template.hooks && template.hooks.postInstall) {
      await this.runHook(template.hooks.postInstall, projectPath, variables);
    }

    logger.success(`Template '${templateName}' applied successfully`);
  }

  /**
   * Load template definition
   */
  async loadTemplate(templateName) {
    // Check built-in templates
    if (this.builtInTemplates.includes(templateName)) {
      return this.getBuiltInTemplate(templateName);
    }

    // Check custom templates
    const templatePath = path.join(this.templatesDir, templateName);
    if (fsSync.existsSync(templatePath)) {
      const config = await this.loadTemplateConfig(templatePath);
      return {
        name: templateName,
        path: templatePath,
        ...config,
      };
    }

    return null;
  }

  /**
   * Get built-in template definition
   */
  getBuiltInTemplate(name) {
    // This would return template definitions for built-in templates
    // For brevity, returning a simplified structure
    return {
      name,
      path: path.join(__dirname, "..", "templates", name),
      files: [
        { src: "package.json", dest: "package.json", template: true },
        { src: "src/app.js", dest: "src/app.js", template: true },
        { src: ".gitignore", dest: ".gitignore", template: false },
      ],
      variables: {
        projectName: "my-project",
        description: "A REST API project",
        author: "",
        license: "MIT",
      },
    };
  }

  /**
   * Process template string
   */
  processTemplate(content, variables) {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Process template path
   */
  processTemplatePath(path, variables) {
    return path.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Run template hook
   */
  async runHook(hook, projectPath, variables) {
    if (typeof hook === "string") {
      // Execute command
      const command = this.processTemplate(hook, variables);
      await this.executeCommand(command, projectPath);
    } else if (Array.isArray(hook)) {
      // Execute multiple commands
      for (const cmd of hook) {
        const command = this.processTemplate(cmd, variables);
        await this.executeCommand(command, projectPath);
      }
    }
  }

  /**
   * Execute command
   */
  async executeCommand(command, cwd) {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    try {
      await execAsync(command, { cwd });
    } catch (error) {
      logger.warn(`Hook command failed: ${command}`, error);
    }
  }
}

/**
 * Enhanced CLI Runner
 * Main class that ties everything together
 */
class EnhancedCLI {
  constructor() {
    this.optionsManager = new CLIOptionsManager();
    this.dryRunManager = null;
    this.interactiveManager = null;
    this.rollbackManager = new RollbackManager();
    this.templateManager = new TemplateManager();
  }

  /**
   * Run CLI with enhanced features
   * @param {Function} mainFunction - Main CLI function to enhance
   * @param {string[]} args - Command line arguments
   */
  async run(mainFunction, args = process.argv.slice(2)) {
    try {
      const { options, positionalArgs } = this.optionsManager.parseArgs(args);

      // Set up dry-run mode
      if (options.dryRun) {
        this.dryRunManager = new DryRunManager(options.verbose);
        logger.info("Running in dry-run mode");
      }

      // Set up interactive mode
      if (options.interactive) {
        this.interactiveManager = new InteractiveModeManager();
        logger.info("Running in interactive mode");
      }

      // Load configuration if provided
      let config = {};
      if (options.configFile) {
        config = await this.optionsManager.loadConfig(options.configFile);
        logger.info(`Loaded configuration from ${options.configFile}`);
      }

      // Handle rollback
      if (options.rollback) {
        await this.rollbackManager.rollback();
        return;
      }

      // Create context object
      const context = {
        options,
        config,
        args: positionalArgs,
        dryRun: this.dryRunManager,
        interactive: this.interactiveManager,
        rollback: this.rollbackManager,
        template: this.templateManager,
      };

      // Create backup if needed
      if (options.backup && !options.dryRun) {
        const projectPath = positionalArgs[0] || process.cwd();
        await this.rollbackManager.createBackup(projectPath, "cli-operation");
      }

      // Run main function with context
      await mainFunction(context);

      // Show dry-run report
      if (options.dryRun) {
        this.dryRunManager.generateReport();
      }

      // Cleanup
      if (this.interactiveManager) {
        this.interactiveManager.close();
      }

      // Clean up old backups
      await this.rollbackManager.cleanupOldBackups();
    } catch (error) {
      logger.error("CLI operation failed", error);
      process.exit(1);
    }
  }

  /**
   * Wrap a file operation for dry-run support
   */
  async fileOperation(context, type, description, operation) {
    if (context.dryRun) {
      context.dryRun.recordOperation(type, description);
      return null; // Don't perform actual operation
    }

    // In interactive mode, ask for confirmation
    if (context.interactive && !context.options.force) {
      const confirmed = await context.interactive.confirm(`${description}?`);
      if (!confirmed) {
        logger.info("Operation cancelled by user");
        return null;
      }
    }

    // Perform actual operation
    return await operation();
  }
}

// Export utilities
module.exports = {
  EnhancedCLI,
  CLIOptionsManager,
  DryRunManager,
  InteractiveModeManager,
  RollbackManager,
  TemplateManager,
};
