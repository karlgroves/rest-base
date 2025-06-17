#!/usr/bin/env node

/**
 * REST-Base Project Creator
 * 
 * Creates a new Node.js RESTful API project with REST-Base standards pre-applied.
 * 
 * @author REST-Base Team
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

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
  
  // Check for reserved names
  const reservedNames = [
    'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9', 'node_modules', 'package.json'
  ];
  if (reservedNames.includes(trimmedName.toLowerCase())) {
    throw new Error(`'${trimmedName}' is a reserved name and cannot be used as a project name`);
  }
  
  // Check for directory traversal attempts
  if (trimmedName.includes('..') || trimmedName.includes('/') || trimmedName.includes('\\')) {
    throw new Error('Project name cannot contain path separators or parent directory references');
  }
  
  // Check length constraints
  if (trimmedName.length > 214) {
    throw new Error('Project name is too long (maximum 214 characters)');
  }
  
  return trimmedName;
}

/**
 * Safely executes shell commands with proper error handling
 * @param {string} command - Command to execute
 * @param {string} cwd - Working directory
 * @returns {boolean} Success status
 */
function safeExecSync(command, cwd) {
  try {
    execSync(command, { cwd, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function createProjectStructure(projectDir) {
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
  
  directories.forEach(dir => {
    const fullPath = path.join(projectDir, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  });
  
  log('Created project directory structure', colors.green);
}

function createPackageJson(projectDir, projectName) {
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
  
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
  
  log('Created package.json', colors.green);
}

function copyStandardsFiles(projectDir, sourceDir) {
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
  
  standardsFiles.forEach(file => {
    const source = path.join(sourceDir, file);
    const destination = path.join(projectDir, 'docs', 'standards', file);
    fs.copyFileSync(source, destination);
  });
  
  log('Copied standards documentation', colors.green);
}

function copyConfigFiles(projectDir, sourceDir) {
  const configFiles = [
    ['.markdownlint.json', '.markdownlint.json'],
    ['.gitignore', '.gitignore']
  ];
  
  configFiles.forEach(([source, destination]) => {
    fs.copyFileSync(
      path.join(sourceDir, source),
      path.join(projectDir, destination)
    );
  });
  
  // Create ESLint config
  const eslintConfig = `module.exports = {
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

  fs.writeFileSync(path.join(projectDir, '.eslintrc.js'), eslintConfig);
  
  // Create .env.example
  const envExample = `# Server Configuration
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

  fs.writeFileSync(path.join(projectDir, '.env.example'), envExample);
  
  log('Created configuration files', colors.green);
}

function createAppFiles(projectDir) {
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
  fs.writeFileSync(path.join(projectDir, 'src', 'app.js'), appJs);
  fs.writeFileSync(path.join(projectDir, 'src', 'utils', 'logger.js'), loggerJs);
  fs.writeFileSync(path.join(projectDir, 'src', 'middlewares', 'errorHandler.js'), errorHandlerJs);
  fs.writeFileSync(path.join(projectDir, 'src', 'routes', 'index.js'), routesJs);
  
  log('Created application files', colors.green);
}

function createReadme(projectDir, projectName) {
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

  fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
  log('Created README.md', colors.green);
}

function initGit(projectDir) {
  // Validate that projectDir is safe to use
  const normalizedPath = path.normalize(projectDir);
  if (!normalizedPath || normalizedPath.includes('..')) {
    log('Warning: Invalid project directory path, skipping Git initialization', colors.yellow);
    return;
  }
  
  // Use safe command execution without changing process directory
  const initSuccess = safeExecSync('git init', normalizedPath);
  if (!initSuccess) {
    log('Warning: Could not initialize Git repository', colors.yellow);
    return;
  }
  
  const addSuccess = safeExecSync('git add .', normalizedPath);
  if (!addSuccess) {
    log('Warning: Could not add files to Git repository', colors.yellow);
    return;
  }
  
  const commitSuccess = safeExecSync('git commit -m "Initial commit with REST-Base standards"', normalizedPath);
  if (!commitSuccess) {
    log('Warning: Could not create initial commit (this is normal if Git user is not configured)', colors.yellow);
    return;
  }
  
  log('Initialized Git repository', colors.green);
}

function main() {
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
  if (fs.existsSync(projectDir)) {
    log(`Directory ${projectDir} already exists. Please choose another name.`, colors.red);
    process.exit(1);
  }
  
  log(`Creating new project: ${projectName}`, colors.blue);
  log('===============================', colors.blue);
  
  // Create project structure
  createProjectStructure(projectDir);
  
  // Create package.json
  createPackageJson(projectDir, projectName);
  
  // Copy standards files
  copyStandardsFiles(projectDir, sourceDir);
  
  // Copy config files
  copyConfigFiles(projectDir, sourceDir);
  
  // Create app files
  createAppFiles(projectDir);
  
  // Create README
  createReadme(projectDir, projectName);
  
  // Initialize Git repository
  initGit(projectDir);
  
  log('\nProject creation complete!', colors.green);
  log(`\nTo get started:`, colors.yellow);
  log(`  cd ${projectName}`, colors.yellow);
  log(`  npm install`, colors.yellow);
  log(`  npm run dev`, colors.yellow);
}

main();