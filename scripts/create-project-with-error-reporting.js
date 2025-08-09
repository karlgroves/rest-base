#!/usr/bin/env node

/**
 * REST-SPEC Project Creator with Error Reporting
 *
 * Enhanced version of create-project.js with comprehensive error reporting.
 *
 * @author Karl Groves
 */

const fs = require("fs").promises;
// const fsSync = require("fs");
const path = require("path");
// const { spawn } = require("child_process");
// const { pipeline } = require("stream/promises");
const UpdateChecker = require("../shared/update-checker");
const logger = require("../shared/logger");
const errorReporter = require("../shared/error-reporter");
const { ErrorCategory } = require("../shared/error-reporter");
// const { formatSection, formatStatus, createSpinner } = require("../shared/cli-utils");

// Mock functions for missing dependencies (same as original)
// const getEslintConfigString = () => "module.exports = {};"
const loadConfig = () => ({
  directories: {
    docs: "docs",
    src: "src",
    tests: "tests",
    public: "public",
    srcSubdirs: [
      "controllers",
      "models",
      "routes",
      "middlewares",
      "utils",
      "config",
    ],
    testSubdirs: ["unit", "integration"],
    publicSubdirs: [],
  },
  scripts: {},
  project: {
    keywords: ["rest-api"],
    author: { name: "" },
    license: "MIT",
    nodeVersion: "22.11.0",
  },
  dependencies: {
    production: {},
    development: {},
  },
  standardsFiles: [],
  configFiles: [],
  thresholds: {
    streamingThreshold: 1048576,
  },
  templates: {
    envExample: {},
  },
});

// Cache for configuration data
// const configCache = {
//   eslintConfig: null,
//   envExample: null,
//   packageJsonTemplate: null,
// };

/**
 * Gets cached ESLint configuration or creates it if not cached
 * @returns {string} ESLint configuration string
 */
// function getEslintConfig() {
//   if (!configCache.eslintConfig) {
//     configCache.eslintConfig = getEslintConfigString();
//   }
//   return configCache.eslintConfig;
// }

/**
 * Gets cached .env.example content or creates it if not cached
 * @returns {string} Environment example file content
 */
// function getEnvExample() {
//   if (!configCache.envExample) {
//     const config = loadConfig();
//     const template = config.templates.envExample;

//     let envContent = "";
//     for (const [section, vars] of Object.entries(template)) {
//       envContent += `# ${section.charAt(0).toUpperCase() + section.slice(1)} Configuration\n`;
//       for (const [key, value] of Object.entries(vars)) {
//         envContent += `${key}=${value}\n`;
//       }
//       envContent += "\n";
//     }

//     configCache.envExample = envContent.trim() + "\n";
//   }
//   return configCache.envExample;
// }

/**
 * Validates project name to prevent security issues
 * @param {string} name - Project name to validate
 * @throws {Error} If project name is invalid
 */
function validateProjectName(name) {
  // Check for empty or null name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    const error = new Error("Project name cannot be empty");
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }

  const trimmedName = name.trim();

  // Check for invalid characters that could be used for command injection
  const invalidChars = /[<>:"|?*;\\&$`(){}[\]!]/;
  if (invalidChars.test(trimmedName)) {
    const error = new Error(
      "Project name contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed.",
    );
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }

  // Check for names that start with dots (hidden files/directories)
  if (trimmedName.startsWith(".")) {
    const error = new Error("Project name cannot start with a dot");
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }

  // Check for reserved names
  const reservedNames = [
    "con",
    "prn",
    "aux",
    "nul",
    "com1",
    "com2",
    "com3",
    "com4",
    "com5",
    "com6",
    "com7",
    "com8",
    "com9",
    "lpt1",
    "lpt2",
    "lpt3",
    "lpt4",
    "lpt5",
    "lpt6",
    "lpt7",
    "lpt8",
    "lpt9",
    "node_modules",
    "package.json",
    "package-lock.json",
    ".git",
    ".gitignore",
    ".env",
    ".npmrc",
    "bin",
    "boot",
    "dev",
    "etc",
    "home",
    "lib",
    "media",
    "mnt",
    "opt",
    "proc",
    "root",
    "run",
    "sbin",
    "srv",
    "sys",
    "tmp",
    "usr",
    "var",
    "system32",
    "windows",
    "program files",
    "documents and settings",
    "admin",
    "administrator",
    "root",
    "sudo",
    "www",
    "ftp",
    "mail",
    "test",
    "temp",
    "cache",
    "logs",
  ];

  if (reservedNames.includes(trimmedName.toLowerCase())) {
    const error = new Error(
      `'${trimmedName}' is a reserved name and cannot be used as a project name`,
    );
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }

  // Enhanced directory traversal prevention
  if (
    trimmedName.includes("..") ||
    trimmedName.includes("/") ||
    trimmedName.includes("\\") ||
    trimmedName.includes("%2e") ||
    trimmedName.includes("%2f") ||
    trimmedName.includes("%5c") ||
    path.normalize(trimmedName) !== trimmedName ||
    path.resolve(trimmedName) !== path.resolve(".", trimmedName)
  ) {
    const error = new Error(
      "Project name cannot contain path separators, parent directory references, or encoded path characters",
    );
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }

  // Check length constraints
  if (trimmedName.length > 214) {
    const error = new Error(
      "Project name is too long (maximum 214 characters)",
    );
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }

  return trimmedName;
}

/**
 * Safely executes shell commands using spawn to prevent command injection
 * @param {string[]} args - Command arguments array
 * @param {string} cwd - Working directory (must be an absolute path)
 * @returns {Promise<boolean>} Success status
 */
// async function safeSpawn(args, cwd) {
//   return new Promise((resolve) => {
//     // Validate working directory path to prevent directory traversal
//     const normalizedCwd = path.resolve(cwd);
//     if (
//       !normalizedCwd.startsWith(process.cwd()) &&
//       !path.isAbsolute(normalizedCwd)
//     ) {
//       resolve(false);
//       return;
//     }

//     const child = spawn(args[0], args.slice(1), {
//       cwd: normalizedCwd,
//       stdio: "ignore",
//       shell: false, // Prevent shell injection
//     });

//     child.on("close", (code) => {
//       resolve(code === 0);
//     });

//     child.on("error", async (error) => {
//       await errorReporter.report(error, {
//         command: 'create-project:safeSpawn',
//         context: { args, cwd: normalizedCwd }
//       });
//       resolve(false);
//     });
//   });
// }

/**
 * Creates the project directory structure
 * @param {string} projectDir - The root directory for the new project
 * @throws {Error} If directory creation fails
 * @returns {Promise<void>}
 */
async function createProjectStructure(projectDir) {
  const config = loadConfig();

  // Build directory list from configuration
  const directories = [
    `${config.directories.docs}/standards`,
    ...config.directories.srcSubdirs.map(
      (dir) => `${config.directories.src}/${dir}`,
    ),
    ...config.directories.testSubdirs.map(
      (dir) => `${config.directories.tests}/${dir}`,
    ),
    ...config.directories.publicSubdirs.map(
      (dir) => `${config.directories.public}/${dir}`,
    ),
  ];

  try {
    // Create directories in parallel for better performance
    await Promise.all(
      directories.map(async (dir) => {
        const fullPath = path.join(projectDir, dir);
        try {
          await fs.mkdir(fullPath, { recursive: true });
        } catch (error) {
          if (error.code !== "EEXIST") {
            error.context = { directory: dir, fullPath };
            throw error;
          }
        }
      }),
    );

    logger.success("Created project directory structure");
  } catch (error) {
    const enhancedError = new Error(
      `Failed to create project structure: ${error.message}`,
    );
    enhancedError.originalError = error;
    enhancedError.context = { projectDir, directories };
    throw enhancedError;
  }
}

/**
 * Creates package.json with project configuration
 * @param {string} projectDir - The project directory path
 * @param {string} projectName - The project name
 * @throws {Error} If package.json creation fails
 * @returns {Promise<void>}
 */
async function createPackageJson(projectDir, projectName) {
  const config = loadConfig();

  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: "A RESTful API using REST-SPEC standards",
    main: `${config.directories.src}/app.js`,
    scripts: config.scripts,
    keywords: config.project.keywords,
    author: config.project.author.name || "",
    license: config.project.license,
    dependencies: config.dependencies.production,
    devDependencies: config.dependencies.development,
    engines: {
      node: `>=${config.project.nodeVersion}`,
    },
  };

  try {
    const packageJsonPath = path.join(projectDir, "package.json");
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      "utf8",
    );
    logger.success("Created package.json");
  } catch (error) {
    const enhancedError = new Error(
      `Failed to create package.json: ${error.message}`,
    );
    enhancedError.originalError = error;
    enhancedError.context = { projectDir, projectName };
    throw enhancedError;
  }
}

/**
 * Intelligently copies a file using regular copy for small files and streaming for large files
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @param {number} threshold - File size threshold in bytes (default: 1MB)
 * @throws {Error} If file copying fails
 */
// async function copyFileIntelligent(source, destination, threshold = null) {
//   if (threshold === null) {
//     const config = loadConfig();
//     threshold = config.thresholds.streamingThreshold;
//   }
//
//   try {
//     // Check if source file exists and get its size
//     const stats = await fs.stat(source);

//     if (stats.size > threshold) {
//       // Use streaming for large files
//       await pipeline(
//         fsSync.createReadStream(source),
//         fsSync.createWriteStream(destination),
//       );
//     } else {
//       // Use regular copy for small files
//       await fs.copyFile(source, destination);
//     }
//   } catch (error) {
//     if (error.code === "ENOENT") {
//       error.category = ErrorCategory.FILE_ERROR;
//     }
//     error.context = { source, destination, threshold };
//     throw error;
//   }
// }

/**
 * Creates application files for the project
 * @param {string} projectDir - The project directory path
 * @throws {Error} If file creation fails
 * @returns {Promise<void>}
 */
async function createAppFiles(projectDir) {
  // Define all application files
  const files = [
    {
      path: path.join(projectDir, "src", "app.js"),
      content: `/**
 * Main application entry point
 */
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(\`Server running on port \${port}\`);
  });
}

module.exports = app;
`,
    },
    {
      path: path.join(projectDir, "src", "utils", "logger.js"),
      content: `/**
 * Logger utility
 */
const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'rest-spec-creator',
  level: process.env.LOG_LEVEL || 'info',
  stream: process.stdout
});

// Don't log during tests
if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

module.exports = logger;
`,
    },
    {
      path: path.join(projectDir, "src", "middlewares", "errorHandler.js"),
      content: `/**
 * Global error handler middleware
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: req.id
  });
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: statusCode === 500 
      ? 'An unexpected error occurred' 
      : err.message,
    requestId: req.id // For support reference
  });
};

module.exports = { errorHandler };
`,
    },
    {
      path: path.join(projectDir, "src", "routes", "index.js"),
      content: `/**
 * API Routes
 */
const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// TODO: Add your routes here
// Example: router.use('/users', require('./userRoutes'));

module.exports = router;
`,
    },
  ];

  try {
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.writeFile(file.path, file.content);
        } catch (error) {
          error.context = { file: file.path };
          throw error;
        }
      }),
    );

    logger.success("Created application files");
  } catch (error) {
    const enhancedError = new Error(
      `Failed to create application files: ${error.message}`,
    );
    enhancedError.originalError = error;
    enhancedError.context = { projectDir };
    throw enhancedError;
  }
}

/**
 * Main entry point for the project creation script
 * Validates command line arguments and orchestrates project creation
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);

  // Check for updates (non-blocking)
  const updateChecker = new UpdateChecker();
  if (!(await updateChecker.isUpdateCheckingDisabled())) {
    updateChecker.checkForUpdates().catch(() => {
      // Ignore update check failures
    });
  }

  if (args.length === 0) {
    const error = new Error("Please provide a project name");
    error.category = ErrorCategory.USER_ERROR;
    await errorReporter.report(error, {
      command: "create-project",
      context: { args },
    });
    logger.error("ERROR: Please provide a project name");
    logger.warn("USAGE: node create-project.js <project-name>");
    process.exit(1);
  }

  let projectName;
  try {
    projectName = validateProjectName(args[0]);
  } catch (error) {
    await errorReporter.report(error, {
      command: "create-project:validation",
      context: { providedName: args[0] },
    });
    logger.error(error.message);
    logger.warn("USAGE: node create-project.js <project-name>");
    process.exit(1);
  }

  const projectDir = path.join(process.cwd(), projectName);
  // const sourceDir = path.join(__dirname, "..");

  // Check if directory already exists
  try {
    await fs.access(projectDir);
    const error = new Error(
      `Directory ${projectDir} already exists. Please choose another name.`,
    );
    error.category = ErrorCategory.USER_ERROR;
    await errorReporter.report(error, {
      command: "create-project:directory-check",
      context: { projectDir },
    });
    logger.error(error.message);
    process.exit(1);
  } catch (error) {
    // Directory doesn't exist (ENOENT) or isn't accessible - this is what we want
    if (error.code !== "ENOENT") {
      await errorReporter.report(error, {
        command: "create-project:directory-access",
        context: { projectDir },
      });
      logger.error(`Cannot access ${projectDir}: ${error.message}`);
      process.exit(1);
    }
  }

  logger.heading(`Creating new project: ${projectName}`);
  logger.info("Starting project creation process");

  try {
    logger.highlight("Phase 1/3: Creating project structure...");

    // First, create the main project directory
    await fs.mkdir(projectDir, { recursive: true });

    // Phase 1: Create initial structure and independent files
    await Promise.all([
      createProjectStructure(projectDir),
      createPackageJson(projectDir, projectName),
    ]);

    logger.success("Phase 1 complete - Project structure created");
    logger.highlight("Phase 2/3: Creating project files...");

    // Phase 2: Create application files
    await createAppFiles(projectDir);

    logger.success("Phase 2 complete - Project files created");

    // Success!
    console.log();
    logger.success("Project creation complete!");
    console.log();
    logger.heading("Next steps to get started:");
    console.log(`  1. Change to project directory: cd ${projectName}`);
    console.log(`  2. Install dependencies: npm install`);
    console.log(`  3. Start development server: npm run dev`);

    // Generate error summary if there were any non-fatal errors
    const summary = errorReporter.getErrorSummary();
    if (summary.totalErrors > 0) {
      logger.info(
        `\nNote: ${summary.totalErrors} non-fatal issues were encountered during creation.`,
      );
      logger.debug("Run with VERBOSE=true for more details.");
    }
  } catch (error) {
    console.log();

    // Report the error
    const report = await errorReporter.report(error, {
      command: "create-project",
      context: {
        projectName,
        projectDir,
        phase: error.phase || "unknown",
      },
      fatal: true,
    });

    logger.error(`Failed to create project: ${error.message}`);
    logger.info(`Error ID: ${report.id}`);

    // Cleanup attempt
    try {
      logger.warn("Attempting to clean up...");
      await fs.rm(projectDir, { recursive: true, force: true });
      logger.success("Cleanup complete");
    } catch (cleanupError) {
      await errorReporter.report(cleanupError, {
        command: "create-project:cleanup",
        context: { projectDir },
      });
      logger.warn("Could not clean up project directory");
    }

    process.exit(1);
  }
}

// Wrap main function with error boundary
const wrappedMain = errorReporter.createErrorBoundary(main, "create-project");

// Execute with global error handling
wrappedMain().catch(async (error) => {
  await errorReporter.report(error, {
    command: "create-project:fatal",
    fatal: true,
  });
  logger.error(`FATAL ERROR: ${error.message}`);
  process.exit(1);
});
