#!/usr/bin/env node

/**
 * REST-Base Standards Setup Script
 * 
 * This script helps incorporate REST-Base standards into a Node.js project.
 * It copies configuration files and documentation, and sets up linting rules.
 * 
 * @author REST-Base Team
 */

const fs = require('fs');
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

// Configuration
const config = {
  standardsFiles: [
    'node_structure_and_naming_conventions.md',
    'sql-standards-and-patterns.md',
    'technologies.md',
    'operations-and-responses.md',
    'request.md',
    'validation.md',
    'global-rules.md',
    'CLAUDE.md'
  ],
  configFiles: [
    '.markdownlint.json',
    '.gitignore'
  ],
  dependencies: {
    dev: [
      'markdownlint-cli',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import'
    ]
  }
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Validates dependency names to prevent command injection
 * @param {string[]} dependencies - Array of dependency names to validate
 * @throws {Error} If any dependency name is invalid
 */
function validateDependencies(dependencies) {
  const validPackageNameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  
  for (const dep of dependencies) {
    if (!dep || typeof dep !== 'string') {
      throw new Error(`Invalid dependency: ${dep}`);
    }
    
    const trimmedDep = dep.trim();
    
    // Check for command injection characters
    const dangerousChars = /[;&|`$(){}\[\]<>"'\\]/;
    if (dangerousChars.test(trimmedDep)) {
      throw new Error(`Dependency name contains dangerous characters: ${trimmedDep}`);
    }
    
    // Validate package name format
    if (!validPackageNameRegex.test(trimmedDep)) {
      throw new Error(`Invalid package name format: ${trimmedDep}`);
    }
    
    // Additional length check
    if (trimmedDep.length > 214) {
      throw new Error(`Package name too long: ${trimmedDep}`);
    }
  }
}

/**
 * Safely executes npm install command
 * @param {string[]} dependencies - Array of validated dependency names
 * @returns {boolean} Success status
 */
function safeNpmInstall(dependencies) {
  try {
    validateDependencies(dependencies);
    
    // Build command with validated dependencies
    const args = ['install', '--save-dev', ...dependencies];
    
    return new Promise((resolve) => {
      const npmProcess = spawn('npm', args, { 
        stdio: 'inherit',
        shell: false // Explicitly disable shell to prevent injection
      });
      
      npmProcess.on('close', (code) => {
        resolve(code === 0);
      });
      
      npmProcess.on('error', () => {
        resolve(false);
      });
    });
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    return Promise.resolve(false);
  }
}

/**
 * Validates target directory path
 * @param {string} targetPath - Directory path to validate
 * @returns {string} Normalized safe path
 * @throws {Error} If path is unsafe
 */
function validateTargetPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') {
    throw new Error('Invalid target path');
  }
  
  const normalized = path.normalize(targetPath);
  
  // Check for directory traversal
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new Error('Path traversal detected in target directory');
  }
  
  return normalized;
}

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, colors.green);
  }
}

function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    log(`Copied: ${path.basename(source)} -> ${destination}`, colors.green);
  } catch (error) {
    log(`Error copying ${source}: ${error.message}`, colors.red);
  }
}

function updatePackageJson(targetDir) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('No package.json found. Please run npm init first.', colors.red);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['lint:md'] = 'markdownlint "*.md" "docs/*.md"';
    packageJson.scripts['lint:js'] = 'eslint --ext .js,.jsx,.ts,.tsx .';
    packageJson.scripts.lint = 'npm run lint:md && npm run lint:js';
    
    // Write updated package.json
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    
    log('Updated package.json with linting scripts', colors.green);
    return true;
  } catch (error) {
    log(`Error updating package.json: ${error.message}`, colors.red);
    return false;
  }
}

async function installDependencies(dependencies) {
  try {
    log(`Installing dev dependencies: ${dependencies.join(', ')}`, colors.blue);
    const success = await safeNpmInstall(dependencies);
    if (success) {
      log('Dependencies installed successfully', colors.green);
    } else {
      log('Failed to install some dependencies', colors.red);
    }
    return success;
  } catch (error) {
    log(`Error installing dependencies: ${error.message}`, colors.red);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  let targetDir;
  try {
    targetDir = validateTargetPath(args[0] || '.');
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
  
  const standardsDir = path.join(targetDir, 'docs', 'standards');
  const scriptsDir = path.join(__dirname, '..');

  log('REST-Base Standards Setup', colors.blue);
  log('=========================', colors.blue);
  
  // Create directories
  createDirectory(path.join(targetDir, 'docs'));
  createDirectory(standardsDir);
  
  // Copy standards files
  config.standardsFiles.forEach(file => {
    const source = path.join(scriptsDir, file);
    const destination = path.join(standardsDir, file);
    copyFile(source, destination);
  });
  
  // Copy config files
  config.configFiles.forEach(file => {
    const source = path.join(scriptsDir, file);
    const destination = path.join(targetDir, file);
    copyFile(source, destination);
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

  fs.writeFileSync(path.join(targetDir, '.eslintrc.js'), eslintConfig);
  log('Created .eslintrc.js', colors.green);
  
  // Update package.json
  const packageUpdated = updatePackageJson(targetDir);
  
  // Install dependencies
  if (packageUpdated) {
    await installDependencies(config.dependencies.dev);
  }
  
  log('\nSetup complete! Standards have been incorporated into your project.', colors.green);
  log('To get started with the standards, run: npm run lint', colors.yellow);
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});