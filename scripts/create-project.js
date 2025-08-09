#!/usr/bin/env node

/**
 * REST-SPEC Project Creator
 *
 * Creates a new Node.js RESTful API project with REST-SPEC templates.
 *
 * @author Karl Groves
 */

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const UpdateChecker = require("../shared/update-checker");
const logger = require("../shared/logger");
// const { formatSection, formatStatus, createSpinner } = require("../shared/cli-utils");

// Mock functions for missing dependencies
const getEslintConfigString = () => "module.exports = {};";
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
const configCache = {
  eslintConfig: null,
  envExample: null,
  packageJsonTemplate: null,
};

/**
 * Gets cached ESLint configuration or creates it if not cached
 * @returns {string} ESLint configuration string
 */
function getEslintConfig() {
  if (!configCache.eslintConfig) {
    configCache.eslintConfig = getEslintConfigString();
  }
  return configCache.eslintConfig;
}

/**
 * Gets cached .env.example content or creates it if not cached
 * @returns {string} Environment example file content
 */
function getEnvExample() {
  if (!configCache.envExample) {
    const config = loadConfig();
    const template = config.templates.envExample;

    let envContent = "";
    for (const [section, vars] of Object.entries(template)) {
      envContent += `# ${section.charAt(0).toUpperCase() + section.slice(1)} Configuration\n`;
      for (const [key, value] of Object.entries(vars)) {
        envContent += `${key}=${value}\n`;
      }
      envContent += "\n";
    }

    configCache.envExample = envContent.trim() + "\n";
  }
  return configCache.envExample;
}

/**
 * Validates project name to prevent security issues
 * @param {string} name - Project name to validate
 * @throws {Error} If project name is invalid
 */
function validateProjectName(name) {
  // Check for empty or null name
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Project name cannot be empty");
  }

  const trimmedName = name.trim();

  // Check for invalid characters that could be used for command injection
  const invalidChars = /[<>:"|?*;\\&$`(){}[\]!]/;
  if (invalidChars.test(trimmedName)) {
    throw new Error(
      "Project name contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed.",
    );
  }

  // Check for names that start with dots (hidden files/directories)
  if (trimmedName.startsWith(".")) {
    throw new Error("Project name cannot start with a dot");
  }

  // Check for reserved names (Windows, UNIX, and common problematic names)
  const reservedNames = [
    // Windows reserved names
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
    // Common system directories and files
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
    // Potentially dangerous names
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
    throw new Error(
      `'${trimmedName}' is a reserved name and cannot be used as a project name`,
    );
  }

  // Enhanced directory traversal prevention
  if (
    trimmedName.includes("..") ||
    trimmedName.includes("/") ||
    trimmedName.includes("\\") ||
    trimmedName.includes("%2e") || // URL encoded dots
    trimmedName.includes("%2f") || // URL encoded forward slash
    trimmedName.includes("%5c") || // URL encoded backslash
    path.normalize(trimmedName) !== trimmedName || // Path normalization changes it
    path.resolve(trimmedName) !== path.resolve(".", trimmedName)
  ) {
    // Absolute path resolution differs
    throw new Error(
      "Project name cannot contain path separators, parent directory references, or encoded path characters",
    );
  }

  // Check length constraints
  if (trimmedName.length > 214) {
    throw new Error("Project name is too long (maximum 214 characters)");
  }

  return trimmedName;
}

/**
 * Safely executes shell commands using spawn to prevent command injection
 * @param {string[]} args - Command arguments array
 * @param {string} cwd - Working directory (must be an absolute path)
 * @returns {Promise<boolean>} Success status
 */
function safeSpawn(args, cwd) {
  return new Promise((resolve) => {
    // Validate working directory path to prevent directory traversal
    const normalizedCwd = path.resolve(cwd);
    if (
      !normalizedCwd.startsWith(process.cwd()) &&
      !path.isAbsolute(normalizedCwd)
    ) {
      resolve(false);
      return;
    }

    const child = spawn(args[0], args.slice(1), {
      cwd: normalizedCwd,
      stdio: "ignore",
      shell: false, // Prevent shell injection
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", () => {
      resolve(false);
    });
  });
}

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
            throw new Error(
              `Failed to create directory ${fullPath}: ${error.message}`,
            );
          }
        }
      }),
    );

    logger.success("Created project directory structure");
  } catch (error) {
    throw new Error(`Failed to create project structure: ${error.message}`);
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
    description: "A RESTful API using REST-Base standards",
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
    throw new Error(`Failed to create package.json: ${error.message}`);
  }
}

/**
 * Intelligently copies a file using regular copy for small files and streaming for large files
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @param {number} threshold - File size threshold in bytes (default: 1MB)
 * @throws {Error} If file copying fails
 */
async function copyFileIntelligent(source, destination, threshold = null) {
  if (threshold === null) {
    const config = loadConfig();
    threshold = config.thresholds.streamingThreshold;
  }
  try {
    // Check if source file exists and get its size
    const stats = await fs.stat(source);

    if (stats.size > threshold) {
      // Use streaming for large files
      await pipeline(
        fsSync.createReadStream(source),
        fsSync.createWriteStream(destination),
      );
    } else {
      // Use regular copy for small files
      await fs.copyFile(source, destination);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Source file not found: ${source}`);
    }
    throw new Error(
      `Failed to copy ${source} to ${destination}: ${error.message}`,
    );
  }
}

/**
 * Copies standards documentation files
 * @param {string} projectDir - The project directory path
 * @param {string} sourceDir - The source directory path
 * @throws {Error} If file copying fails
 * @returns {Promise<void>}
 */
async function copyStandardsFiles(projectDir, sourceDir) {
  const config = loadConfig();
  const standardsFiles = config.standardsFiles;

  try {
    // Copy files in parallel for better performance
    await Promise.all(
      standardsFiles.map(async (file) => {
        const source = path.join(sourceDir, file);
        const destination = path.join(
          projectDir,
          config.directories.docs,
          "standards",
          file,
        );

        try {
          // Use intelligent copying (streaming for large files)
          await copyFileIntelligent(source, destination);
        } catch (error) {
          throw new Error(`Failed to copy ${file}: ${error.message}`);
        }
      }),
    );

    logger.success("Copied standards documentation");
  } catch (error) {
    throw new Error(`Failed to copy standards files: ${error.message}`);
  }
}

/**
 * Copies configuration files to the project
 * @param {string} projectDir - The project directory path
 * @param {string} sourceDir - The source directory path
 * @throws {Error} If file copying fails
 * @returns {Promise<void>}
 */
async function copyConfigFiles(projectDir, sourceDir) {
  const config = loadConfig();
  const configFiles = config.configFiles.map((file) => [file, file]);

  try {
    // Copy config files in parallel
    await Promise.all(
      configFiles.map(async ([source, destination]) => {
        const sourcePath = path.join(sourceDir, source);
        const destPath = path.join(projectDir, destination);

        try {
          // Use intelligent copying (streaming for large files)
          await copyFileIntelligent(sourcePath, destPath);
        } catch (error) {
          throw new Error(`Failed to copy ${source}: ${error.message}`);
        }
      }),
    );

    // Get cached configuration data
    const eslintConfig = getEslintConfig();
    const envExample = getEnvExample();

    // Write configuration files in parallel
    await Promise.all([
      fs.writeFile(path.join(projectDir, ".eslintrc.js"), eslintConfig),
      fs.writeFile(path.join(projectDir, ".env.example"), envExample),
    ]);

    logger.success("Created configuration files");
  } catch (error) {
    throw new Error(`Failed to create config files: ${error.message}`);
  }
}

/**
 * Creates application files for the project
 * @param {string} projectDir - The project directory path
 * @throws {Error} If file creation fails
 * @returns {Promise<void>}
 */
async function createAppFiles(projectDir) {
  // app.js
  const appJs = `/**
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
`;

  // logger.js
  const loggerJs = `/**
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
`;

  // errorHandler.js
  const errorHandlerJs = `/**
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
`;

  // routes/index.js
  const routesJs = `/**
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
`;

  // Write files
  try {
    const files = [
      { path: path.join(projectDir, "src", "app.js"), content: appJs },
      {
        path: path.join(projectDir, "src", "utils", "logger.js"),
        content: loggerJs,
      },
      {
        path: path.join(projectDir, "src", "middlewares", "errorHandler.js"),
        content: errorHandlerJs,
      },
      {
        path: path.join(projectDir, "src", "routes", "index.js"),
        content: routesJs,
      },
    ];

    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.writeFile(file.path, file.content);
        } catch (error) {
          throw new Error(`Failed to create ${file.path}: ${error.message}`);
        }
      }),
    );

    logger.success("Created application files");
  } catch (error) {
    throw new Error(`Failed to create application files: ${error.message}`);
  }
}

/**
 * Creates README.md for the project
 * @param {string} projectDir - The project directory path
 * @param {string} projectName - The project name
 * @throws {Error} If README creation fails
 * @returns {Promise<void>}
 */
async function createReadme(projectDir, projectName) {
  const readme = `# ${projectName}

A RESTful API built following REST-Base standards.

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm
- MySQL/MariaDB

### Installation

1. Clone this repository
2. Install dependencies: \`npm install\`
3. Copy .env.example to .env and update with your configuration
4. Start the server: \`npm run dev\`

## Project Structure

\`\`\`
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Express middlewares
├── models/         # Data models
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── app.js          # Express app setup
tests/              # Test files
docs/               # Documentation
└── standards/      # REST-Base standards
\`\`\`

## Development

### Available Scripts

- \`npm run dev\`: Start development server with hot reload
- \`npm start\`: Start production server
- \`npm test\`: Run tests
- \`npm run lint\`: Run linters (ESLint and Markdownlint)

## Standards

This project follows the REST-Base standards. See the \`docs/standards/\` directory for details.

## License

This project is licensed under the MIT License.
`;

  try {
    await fs.writeFile(path.join(projectDir, "README.md"), readme);
    logger.success("Created README.md");
  } catch (error) {
    throw new Error(`Failed to create README.md: ${error.message}`);
  }
}

/**
 * Initializes a Git repository in the project directory
 * @param {string} projectDir - The project directory path
 */
async function initGit(projectDir) {
  // Enhanced validation to prevent directory traversal attacks
  const normalizedPath = path.resolve(projectDir);

  // Ensure the path is safe and within expected bounds
  if (
    !normalizedPath ||
    normalizedPath.includes("..") ||
    !path.isAbsolute(normalizedPath)
  ) {
    logger.warn(
      "WARNING: Invalid or unsafe project directory path, skipping Git initialization",
    );
    return;
  }

  // Check if directory exists and is accessible
  try {
    await fs.access(normalizedPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      logger.warn(
        "WARNING: Project directory does not exist, skipping Git initialization",
      );
    } else {
      logger.warn(
        "WARNING: Cannot access project directory, skipping Git initialization",
      );
    }
    return;
  }

  // Use secure spawn-based command execution
  const initSuccess = await safeSpawn(["git", "init"], normalizedPath);
  if (!initSuccess) {
    logger.warn("Could not initialize Git repository");
    return;
  }

  const addSuccess = await safeSpawn(["git", "add", "."], normalizedPath);
  if (!addSuccess) {
    logger.warn("Could not add files to Git repository");
    return;
  }

  const commitSuccess = await safeSpawn(
    ["git", "commit", "-m", "Initial commit with REST-Base standards"],
    normalizedPath,
  );
  if (!commitSuccess) {
    logger.warn(
      "WARNING: Could not create initial commit (this is normal if Git user is not configured)",
    );
    return;
  }

  logger.success("Initialized Git repository");
}

/**
 * Performs comprehensive rollback of project creation
 * @param {string} projectDir - The project directory to clean up
 * @param {string} projectName - The project name for logging
 */
async function performRollback(projectDir, projectName) {
  logger.warn("Starting rollback process...");

  const rollbackSteps = [];

  try {
    // Check if project directory exists
    await fs.access(projectDir);
    rollbackSteps.push("Project directory exists");

    // Check for Git repository
    try {
      await fs.access(path.join(projectDir, ".git"));
      rollbackSteps.push("Git repository detected");
    } catch (gitError) {
      // No git repository
    }

    // Analyze directory contents
    try {
      const items = await fs.readdir(projectDir);
      rollbackSteps.push(`Directory contains ${items.length} items`);

      // Check for specific files/directories to provide detailed rollback info
      const keyItems = [".git", "package.json", "src", "docs", "README.md"];
      const foundItems = keyItems.filter((item) => items.includes(item));
      if (foundItems.length > 0) {
        rollbackSteps.push(`Key project files found: ${foundItems.join(", ")}`);
      }
    } catch (readError) {
      rollbackSteps.push("Could not analyze directory contents");
    }

    // Perform the cleanup
    logger.warn(`Cleaning up project directory: ${projectDir}`);
    await fs.rm(projectDir, { recursive: true, force: true });

    // Verify cleanup
    try {
      await fs.access(projectDir);
      logger.warn("Directory still exists after cleanup attempt");
    } catch (verifyError) {
      logger.success("Project directory successfully removed");
    }
  } catch (initialError) {
    if (initialError.code === "ENOENT") {
      logger.info("No cleanup needed - project directory does not exist");
      return;
    } else {
      logger.error(`During rollback: ${initialError.message}`);
    }
  }

  // Log rollback summary
  if (rollbackSteps.length > 0) {
    logger.info("\nRollback summary:");
    rollbackSteps.forEach((step) => {
      logger.info(`  Step: ${step}`);
    });
  }

  logger.warn("\nTo try again:");
  logger.warn(`  node create-project.js ${projectName}`);
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
    logger.error("ERROR: Please provide a project name");
    logger.warn("USAGE: node create-project.js <project-name>");
    process.exit(1);
  }

  let projectName;
  try {
    projectName = validateProjectName(args[0]);
  } catch (error) {
    logger.error(error.message);
    logger.warn("USAGE: node create-project.js <project-name>");
    process.exit(1);
  }

  const projectDir = path.join(process.cwd(), projectName);
  const sourceDir = path.join(__dirname, "..");

  // Check if directory already exists
  try {
    await fs.access(projectDir);
    logger.error(
      `ERROR: Directory ${projectDir} already exists. Please choose another name.`,
    );
    process.exit(1);
  } catch (error) {
    // Directory doesn't exist (ENOENT) or isn't accessible - this is what we want for a new project
    if (error.code !== "ENOENT") {
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

    // Phase 1: Create initial structure and independent files (parallel execution)
    await Promise.all([
      createProjectStructure(projectDir),
      createPackageJson(projectDir, projectName),
      createReadme(projectDir, projectName),
    ]);

    logger.success("Phase 1 complete - Project structure created");
    logger.highlight("Phase 2/3: Creating project files...");

    // Phase 2: Copy and create files that depend on directory structure (parallel execution)
    await Promise.all([
      copyStandardsFiles(projectDir, sourceDir),
      copyConfigFiles(projectDir, sourceDir),
      createAppFiles(projectDir),
    ]);

    logger.success("Phase 2 complete - Project files created");
    logger.highlight("Phase 3/3: Initializing Git repository...");

    // Phase 3: Git initialization (must run after all files are created)
    await initGit(projectDir);

    logger.success("Phase 3 complete - Git repository initialized");
    console.log();
    logger.success("Project creation complete!");
    console.log();
    logger.heading("Next steps to get started:");
    console.log(`  1. Change to project directory: cd ${projectName}`);
    console.log(`  2. Install dependencies: npm install`);
    console.log(`  3. Start development server: npm run dev`);
  } catch (error) {
    console.log();
    logger.error(`Creating project: ${error.message}`);

    // Comprehensive rollback mechanism
    await performRollback(projectDir, projectName);

    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`FATAL ERROR: ${error.message}`);
  process.exit(1);
});
