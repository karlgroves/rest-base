#!/usr/bin/env node

/**
 * REST-Base Project Creator
 * 
 * Creates a new Node.js RESTful API project with REST-Base standards pre-applied.
 * 
 * @author REST-Base Team
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Define colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Cache for configuration data
const configCache = {
  eslintConfig: null,
  envExample: null,
  packageJsonTemplate: null
};

/**
 * Gets cached ESLint configuration or creates it if not cached
 * @returns {string} ESLint configuration string
 */
function getEslintConfig() {
  if (!configCache.eslintConfig) {
    configCache.eslintConfig = `module.exports = {
  extends: 'airbnb-base',
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'comma-dangle': ['error', 'never'],
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }]
  },
};`;
  }
  return configCache.eslintConfig;
}

/**
 * Gets cached .env.example content or creates it if not cached
 * @returns {string} Environment example file content
 */
function getEnvExample() {
  if (!configCache.envExample) {
    configCache.envExample = `# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=db_name
DB_USER=db_user
DB_PASSWORD=db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h

# Logging
LOG_LEVEL=info
`;
  }
  return configCache.envExample;
}

/**
 * Logs a colored message to the console
 * @param {string} message - Message to log
 * @param {string} color - ANSI color code (optional)
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Validates project name to prevent security issues
 * @param {string} name - Project name to validate
 * @throws {Error} If project name is invalid
 */
function validateProjectName(name) {
  // Check for empty or null name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Project name cannot be empty');
  }
  
  const trimmedName = name.trim();
  
  // Check for invalid characters that could be used for command injection
  const invalidChars = /[<>:"|?*;\\&$`(){}[\]!]/;
  if (invalidChars.test(trimmedName)) {
    throw new Error('Project name contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed.');
  }
  
  // Check for names that start with dots (hidden files/directories)
  if (trimmedName.startsWith('.')) {
    throw new Error('Project name cannot start with a dot');
  }
  
  // Check for reserved names (Windows, UNIX, and common problematic names)
  const reservedNames = [
    // Windows reserved names
    'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
    // Common system directories and files
    'node_modules', 'package.json', 'package-lock.json', '.git', '.gitignore', '.env', '.npmrc',
    'bin', 'boot', 'dev', 'etc', 'home', 'lib', 'media', 'mnt', 'opt', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var',
    'system32', 'windows', 'program files', 'documents and settings',
    // Potentially dangerous names
    'admin', 'administrator', 'root', 'sudo', 'www', 'ftp', 'mail', 'test', 'temp', 'cache', 'logs'
  ];
  if (reservedNames.includes(trimmedName.toLowerCase())) {
    throw new Error(`'${trimmedName}' is a reserved name and cannot be used as a project name`);
  }
  
  // Enhanced directory traversal prevention
  if (trimmedName.includes('..') || 
      trimmedName.includes('/') || 
      trimmedName.includes('\\') ||
      trimmedName.includes('%2e') ||  // URL encoded dots
      trimmedName.includes('%2f') ||  // URL encoded forward slash
      trimmedName.includes('%5c') ||  // URL encoded backslash
      path.normalize(trimmedName) !== trimmedName ||  // Path normalization changes it
      path.resolve(trimmedName) !== path.resolve('.', trimmedName)) {  // Absolute path resolution differs
    throw new Error('Project name cannot contain path separators, parent directory references, or encoded path characters');
  }
  
  // Check length constraints
  if (trimmedName.length > 214) {
    throw new Error('Project name is too long (maximum 214 characters)');
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
    if (!normalizedCwd.startsWith(process.cwd()) && !path.isAbsolute(normalizedCwd)) {
      resolve(false);
      return;
    }

    const child = spawn(args[0], args.slice(1), {
      cwd: normalizedCwd,
      stdio: 'ignore',
      shell: false // Prevent shell injection
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
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
  const directories = [
    'src/config',
    'src/controllers',
    'src/middlewares',
    'src/models',
    'src/routes',
    'src/services',
    'src/utils',
    'tests/unit',
    'tests/integration',
    'tests/fixtures',
    'docs/standards',
    'public/images',
    'public/styles',
    'public/scripts'
  ];
  
  try {
    // Create directories in parallel for better performance
    await Promise.all(directories.map(async (dir) => {
      const fullPath = path.join(projectDir, dir);
      try {
        await fs.mkdir(fullPath, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw new Error(`Failed to create directory ${fullPath}: ${error.message}`);
        }
      }
    }));
    
    log('Created project directory structure', colors.green);
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
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'A RESTful API using REST-Base standards',
    main: 'src/app.js',
    scripts: {
      start: 'node src/app.js',
      dev: 'nodemon src/app.js',
      test: 'jest',
      'lint:md': 'markdownlint "*.md" "docs/*.md"',
      'lint:js': 'eslint --ext .js,.jsx,.ts,.tsx .',
      lint: 'npm run lint:md && npm run lint:js',
      'test:watch': 'jest --watch',
      'test:coverage': 'jest --coverage'
    },
    keywords: [
      'rest',
      'api',
      'node',
      'express'
    ],
    author: '',
    license: 'MIT',
    dependencies: {
      'bcrypt': '^5.1.1',
      'cors': '^2.8.5',
      'dotenv': '^16.3.1',
      'express': '^4.18.2',
      'express-validator': '^7.0.1',
      'helmet': '^7.1.0',
      'joi': '^17.11.0',
      'jsonwebtoken': '^9.0.2',
      'morgan': '^1.10.0',
      'mysql2': '^3.6.5',
      'sequelize': '^6.35.1',
      'winston': '^3.11.0'
    },
    devDependencies: {
      'eslint': '^8.55.0',
      'eslint-config-airbnb-base': '^15.0.0',
      'eslint-plugin-import': '^2.29.0',
      'jest': '^29.7.0',
      'markdownlint-cli': '^0.37.0',
      'nodemon': '^3.0.2',
      'supertest': '^6.3.3'
    }
  };
  
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    log('Created package.json', colors.green);
  } catch (error) {
    throw new Error(`Failed to create package.json: ${error.message}`);
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
  const standardsFiles = [
    'node_structure_and_naming_conventions.md',
    'sql-standards-and-patterns.md',
    'technologies.md',
    'operations-and-responses.md',
    'request.md',
    'validation.md',
    'global-rules.md',
    'CLAUDE.md'
  ];
  
  try {
    // Copy files in parallel for better performance
    await Promise.all(standardsFiles.map(async (file) => {
      const source = path.join(sourceDir, file);
      const destination = path.join(projectDir, 'docs', 'standards', file);
      
      try {
        // Check if source file exists
        await fs.access(source);
        await fs.copyFile(source, destination);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Source file not found: ${source}`);
        }
        throw new Error(`Failed to copy ${file}: ${error.message}`);
      }
    }));
    
    log('Copied standards documentation', colors.green);
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
  const configFiles = [
    ['.markdownlint.json', '.markdownlint.json'],
    ['.gitignore', '.gitignore']
  ];
  
  try {
    // Copy config files in parallel
    await Promise.all(configFiles.map(async ([source, destination]) => {
      const sourcePath = path.join(sourceDir, source);
      const destPath = path.join(projectDir, destination);
      
      try {
        await fs.access(sourcePath);
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Source config file not found: ${sourcePath}`);
        }
        throw new Error(`Failed to copy ${source}: ${error.message}`);
      }
    }));
    
    // Get cached configuration data
    const eslintConfig = getEslintConfig();
    const envExample = getEnvExample();

    // Write configuration files in parallel
    await Promise.all([
      fs.writeFile(path.join(projectDir, '.eslintrc.js'), eslintConfig),
      fs.writeFile(path.join(projectDir, '.env.example'), envExample)
    ]);
    
    log('Created configuration files', colors.green);
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
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
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
      { path: path.join(projectDir, 'src', 'app.js'), content: appJs },
      { path: path.join(projectDir, 'src', 'utils', 'logger.js'), content: loggerJs },
      { path: path.join(projectDir, 'src', 'middlewares', 'errorHandler.js'), content: errorHandlerJs },
      { path: path.join(projectDir, 'src', 'routes', 'index.js'), content: routesJs }
    ];
    
    await Promise.all(files.map(async (file) => {
      try {
        await fs.writeFile(file.path, file.content);
      } catch (error) {
        throw new Error(`Failed to create ${file.path}: ${error.message}`);
      }
    }));
    
    log('Created application files', colors.green);
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
    await fs.writeFile(path.join(projectDir, 'README.md'), readme);
    log('Created README.md', colors.green);
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
  if (!normalizedPath || 
      normalizedPath.includes('..') || 
      !path.isAbsolute(normalizedPath)) {
    log('Warning: Invalid or unsafe project directory path, skipping Git initialization', colors.yellow);
    return;
  }
  
  // Check if directory exists and is accessible
  try {
    await fs.access(normalizedPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      log('Warning: Project directory does not exist, skipping Git initialization', colors.yellow);
    } else {
      log('Warning: Cannot access project directory, skipping Git initialization', colors.yellow);
    }
    return;
  }
  
  // Use secure spawn-based command execution
  const initSuccess = await safeSpawn(['git', 'init'], normalizedPath);
  if (!initSuccess) {
    log('Warning: Could not initialize Git repository', colors.yellow);
    return;
  }
  
  const addSuccess = await safeSpawn(['git', 'add', '.'], normalizedPath);
  if (!addSuccess) {
    log('Warning: Could not add files to Git repository', colors.yellow);
    return;
  }
  
  const commitSuccess = await safeSpawn(['git', 'commit', '-m', 'Initial commit with REST-Base standards'], normalizedPath);
  if (!commitSuccess) {
    log('Warning: Could not create initial commit (this is normal if Git user is not configured)', colors.yellow);
    return;
  }
  
  log('Initialized Git repository', colors.green);
}

/**
 * Performs comprehensive rollback of project creation
 * @param {string} projectDir - The project directory to clean up
 * @param {string} projectName - The project name for logging
 */
async function performRollback(projectDir, projectName) {
  log('Starting rollback process...', colors.yellow);
  
  const rollbackSteps = [];
  
  try {
    // Check if project directory exists
    await fs.access(projectDir);
    rollbackSteps.push('Project directory exists');
    
    // Check for Git repository
    try {
      await fs.access(path.join(projectDir, '.git'));
      rollbackSteps.push('Git repository detected');
    } catch (gitError) {
      // No git repository
    }
    
    // Analyze directory contents
    try {
      const items = await fs.readdir(projectDir);
      rollbackSteps.push(`Directory contains ${items.length} items`);
      
      // Check for specific files/directories to provide detailed rollback info
      const keyItems = ['.git', 'package.json', 'src', 'docs', 'README.md'];
      const foundItems = keyItems.filter(item => items.includes(item));
      if (foundItems.length > 0) {
        rollbackSteps.push(`Key project files found: ${foundItems.join(', ')}`);
      }
    } catch (readError) {
      rollbackSteps.push('Could not analyze directory contents');
    }
    
    // Perform the cleanup
    log(`Cleaning up project directory: ${projectDir}`, colors.yellow);
    await fs.rm(projectDir, { recursive: true, force: true });
    
    // Verify cleanup
    try {
      await fs.access(projectDir);
      log('Warning: Directory still exists after cleanup attempt', colors.yellow);
    } catch (verifyError) {
      log('Project directory successfully removed', colors.green);
    }
    
  } catch (initialError) {
    if (initialError.code === 'ENOENT') {
      log('No cleanup needed - project directory does not exist', colors.yellow);
      return;
    } else {
      log(`Error during rollback: ${initialError.message}`, colors.red);
    }
  }
  
  // Log rollback summary
  if (rollbackSteps.length > 0) {
    log('\nRollback summary:', colors.cyan);
    rollbackSteps.forEach(step => {
      log(`  - ${step}`, colors.gray);
    });
  }
  
  log('\nTo try again:', colors.yellow);
  log(`  node create-project.js ${projectName}`, colors.yellow);
}

/**
 * Main entry point for the project creation script
 * Validates command line arguments and orchestrates project creation
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('Please provide a project name', colors.red);
    log('Usage: node create-project.js <project-name>', colors.yellow);
    process.exit(1);
  }
  
  let projectName;
  try {
    projectName = validateProjectName(args[0]);
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    log('Usage: node create-project.js <project-name>', colors.yellow);
    process.exit(1);
  }
  
  const projectDir = path.join(process.cwd(), projectName);
  const sourceDir = path.join(__dirname, '..');
  
  // Check if directory already exists
  try {
    await fs.access(projectDir);
    log(`Directory ${projectDir} already exists. Please choose another name.`, colors.red);
    process.exit(1);
  } catch (error) {
    // Directory doesn't exist (ENOENT) or isn't accessible - this is what we want for a new project
    if (error.code !== 'ENOENT') {
      log(`Cannot access ${projectDir}: ${error.message}`, colors.red);
      process.exit(1);
    }
  }
  
  log(`Creating new project: ${projectName}`, colors.blue);
  log('===============================', colors.blue);
  
  try {
    log('Phase 1/3: Creating project structure...', colors.cyan);
    
    // Phase 1: Create initial structure and independent files (parallel execution)
    await Promise.all([
      createProjectStructure(projectDir),
      createPackageJson(projectDir, projectName),
      createReadme(projectDir, projectName)
    ]);
    
    log('✓ Phase 1 complete', colors.green);
    log('Phase 2/3: Creating project files...', colors.cyan);
    
    // Phase 2: Copy and create files that depend on directory structure (parallel execution)
    await Promise.all([
      copyStandardsFiles(projectDir, sourceDir),
      copyConfigFiles(projectDir, sourceDir),
      createAppFiles(projectDir)
    ]);
    
    log('✓ Phase 2 complete', colors.green);
    log('Phase 3/3: Initializing Git repository...', colors.cyan);
    
    // Phase 3: Git initialization (must run after all files are created)
    await initGit(projectDir);
    
    log('✓ Phase 3 complete', colors.green);
    log('\n🎉 Project creation complete!', colors.green);
    log(`\nTo get started:`, colors.yellow);
    log(`  cd ${projectName}`, colors.yellow);
    log(`  npm install`, colors.yellow);
    log(`  npm run dev`, colors.yellow);
  } catch (error) {
    log(`\nError creating project: ${error.message}`, colors.red);
    
    // Comprehensive rollback mechanism
    await performRollback(projectDir, projectName);
    
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});