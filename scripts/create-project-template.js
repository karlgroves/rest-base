#!/usr/bin/env node

/**
 * REST-SPEC Project Template Generator
 *
 * Creates a new Node.js RESTful API project from REST-SPEC templates.
 *
 * @author Karl Groves
 */

const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

class ProjectGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Prompt user for input
   */
  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Replace template variables in content
   */
  replaceTemplateVariables(content, variables) {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Process template files
   */
  async processTemplateFiles(projectPath, variables) {
    const processFile = async (filePath) => {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        const entries = await fs.readdir(filePath);
        for (const entry of entries) {
          await processFile(path.join(filePath, entry));
        }
      } else {
        const content = await fs.readFile(filePath, "utf8");
        const processedContent = this.replaceTemplateVariables(
          content,
          variables,
        );
        await fs.writeFile(filePath, processedContent);
      }
    };

    await processFile(projectPath);
  }

  /**
   * Validate project name
   */
  validateProjectName(name) {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error("Project name cannot be empty");
    }

    const trimmedName = name.trim();

    // Check for invalid characters
    const invalidChars = /[<>:"|?*;\\&$`(){}[\]!]/;
    if (invalidChars.test(trimmedName)) {
      throw new Error(
        "Project name contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed.",
      );
    }

    // Check for path separators
    if (trimmedName.includes("/") || trimmedName.includes("\\")) {
      throw new Error("Project name cannot contain path separators");
    }

    return trimmedName;
  }

  /**
   * Create new project
   */
  async createProject() {
    console.log("🚀 REST-SPEC Project Generator");
    console.log("===============================\\n");

    try {
      // Get project details
      const projectName = await this.prompt("Project name: ");
      const description = await this.prompt("Project description: ");
      const author = await this.prompt("Author name: ");

      const validatedName = this.validateProjectName(projectName);
      const projectPath = path.join(process.cwd(), validatedName);

      // Check if directory already exists
      try {
        await fs.access(projectPath);
        console.error(`❌ Directory '${validatedName}' already exists`);
        process.exit(1);
      } catch (error) {
        // Directory doesn't exist - this is what we want
      }

      console.log(`\\n📁 Creating project in: ${projectPath}`);

      // Copy template
      const templatePath = path.join(__dirname, "../templates/default");
      try {
        await fs.access(templatePath);
      } catch (error) {
        console.error("❌ Default template not found");
        process.exit(1);
      }

      await this.copyDirectory(templatePath, projectPath);

      // Process template variables
      const variables = {
        projectName: validatedName,
        description: description || "A REST API built with REST-SPEC",
        author: author || "Developer",
      };

      console.log("🔄 Processing template files...");
      await this.processTemplateFiles(projectPath, variables);

      console.log("\\n✅ Project created successfully!");
      console.log("\\nNext steps:");
      console.log(`  cd ${validatedName}`);
      console.log("  npm install");
      console.log("  cp .env.example .env");
      console.log("  # Edit .env with your configuration");
      console.log("  npm run dev");
    } catch (error) {
      console.error("❌ Error creating project:", error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new ProjectGenerator();
  generator.createProject();
}

module.exports = ProjectGenerator;
