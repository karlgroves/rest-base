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
    const dangerousChars = /[;&|`$(){}[\]<>"'\\]/;
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

/**
 * Safely creates a directory with error handling
 * @param {string} dir - Directory path to create
 * @throws {Error} If directory creation fails
 */
async function createDirectory(dir) {
  try {
    await fs.promises.access(dir);
    // Directory already exists
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        await fs.promises.mkdir(dir, { recursive: true });
        log(`Created directory: ${dir}`, colors.green);
      } catch (mkdirError) {
        throw new Error(`Failed to create directory ${dir}: ${mkdirError.message}`);
      }
    } else {
      throw new Error(`Error checking directory ${dir}: ${error.message}`);
    }
  }
}

/**
 * Safely copies a file with error handling
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @throws {Error} If file copying fails
 */
async function copyFile(source, destination) {
  try {
    // Check if source file exists
    await fs.promises.access(source);
    await fs.promises.copyFile(source, destination);
    log(`Copied: ${path.basename(source)} -> ${destination}`, colors.green);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Source file not found: ${source}`);
    }
    throw new Error(`Failed to copy ${source} to ${destination}: ${error.message}`);
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
  
  try {
    // Create directories
    await createDirectory(path.join(targetDir, 'docs'));
    await createDirectory(standardsDir);
    
    // Copy standards files
    await Promise.all(config.standardsFiles.map(async (file) => {
      const source = path.join(scriptsDir, file);
      const destination = path.join(standardsDir, file);
      await copyFile(source, destination);
    }));
    
    // Copy config files
    await Promise.all(config.configFiles.map(async (file) => {
      const source = path.join(scriptsDir, file);
      const destination = path.join(targetDir, file);
      await copyFile(source, destination);
    }));
  
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

    await fs.promises.writeFile(path.join(targetDir, '.eslintrc.js'), eslintConfig);
    log('Created .eslintrc.js', colors.green);
    
    // Update package.json
    const packageUpdated = updatePackageJson(targetDir);
    
    // Install dependencies
    if (packageUpdated) {
      await installDependencies(config.dependencies.dev);
    }
    
    log('\nSetup complete! Standards have been incorporated into your project.', colors.green);
    log('To get started with the standards, run: npm run lint', colors.yellow);
  } catch (error) {
    log(`\nError during setup: ${error.message}`, colors.red);
    log('Setup failed. Some files may have been partially created.', colors.yellow);
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});