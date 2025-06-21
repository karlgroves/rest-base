#!/usr/bin/env node

/**
 * Enhanced REST-Base Project Creator
 *
 * Creates a new Node.js RESTful API project with REST-Base standards pre-applied.
 * Includes dry-run mode, interactive mode, config file support, and templates.
 *
 * @author REST-Base Team
 */

const { EnhancedCLI } = require("./cli-enhancements");

// Create enhanced CLI instance
const cli = new EnhancedCLI();

// Main function that wraps the original create-project functionality
async function enhancedCreateProject(context) {
  const { options, args, dryRun, interactive, template } = context;

  // Get project name
  let projectName = args[0];

  if (!projectName && interactive) {
    projectName = await interactive.prompt("Enter project name:");
  }

  if (!projectName) {
    console.error("Please provide a project name");
    console.log("Usage: rest-base-create <project-name> [options]");
    process.exit(1);
  }

  // Select template if interactive mode
  let selectedTemplate = options.template || "default";

  if (interactive && !options.template) {
    const templates = await template.listTemplates();
    const choices = templates.map((t) => ({
      name: `${t.name} - ${t.description}`,
      value: t.name,
    }));

    selectedTemplate = await interactive.select(
      "Select project template:",
      choices,
    );
  }

  // Prepare enhanced arguments for original create-project
  const enhancedArgs = [projectName];

  // Add template to args if not default
  if (selectedTemplate !== "default") {
    enhancedArgs.push("--template", selectedTemplate);
  }

  // Run original create-project with enhancements
  process.argv = ["node", "create-project.js", ...enhancedArgs];

  // If dry-run mode, intercept file operations
  if (dryRun) {
    await simulateProjectCreation(context, projectName, selectedTemplate);
  } else {
    // Run actual project creation
    await require("./create-project");
  }
}

/**
 * Simulate project creation in dry-run mode
 */
async function simulateProjectCreation(context, projectName, templateName) {
  const { dryRun } = context;

  // Record operations that would be performed
  dryRun.recordOperation("create", `Create project directory: ${projectName}`);
  dryRun.recordOperation("create", "Create directory structure", {
    directories: [
      "src/controllers",
      "src/models",
      "src/routes",
      "src/middlewares",
      "src/services",
      "src/utils",
      "src/config",
      "tests/unit",
      "tests/integration",
      "tests/fixtures",
      "docs/api",
      "docs/standards",
      "public/uploads",
      "scripts",
      "logs",
    ],
  });

  dryRun.recordOperation("copy", "Copy REST-Base standards documentation");
  dryRun.recordOperation("create", "Generate package.json with dependencies");
  dryRun.recordOperation(
    "create",
    "Create application files (app.js, routes, etc.)",
  );
  dryRun.recordOperation(
    "create",
    "Generate configuration files (.env.example, .gitignore, etc.)",
  );
  dryRun.recordOperation("execute", "Initialize git repository");

  if (templateName !== "default") {
    dryRun.recordOperation("copy", `Apply template: ${templateName}`);
  }
}

// Run the enhanced CLI
cli.run(enhancedCreateProject);
