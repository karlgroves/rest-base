#!/usr/bin/env node

/**
 * REST-Base Standards Setup Script
 * 
 * This script helps incorporate REST-Base standards into a Node.js project.
 * It copies configuration files and documentation, and sets up linting rules.
 * 
 * @author REST-Base Team
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');

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

// Cache for configuration data
const configCache = {
  eslintConfig: null,
  envExample: null
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

// Helper functions
/**
 * Logs a colored message to the console
 * @param {string} message - Message to log
 * @param {string} color - ANSI color code (optional)
 */
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
    await fs.access(dir);
    // Directory already exists and is accessible
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, create it
      try {
        await fs.mkdir(dir, { recursive: true });
        log(`Created directory: ${dir}`, colors.green);
      } catch (mkdirError) {
        if (mkdirError.code === 'EACCES') {
          throw new Error(`Permission denied creating directory ${dir}. Please check permissions.`);
        } else if (mkdirError.code === 'ENOTDIR') {
          throw new Error(`Cannot create directory ${dir}: parent path is not a directory`);
        } else {
          throw new Error(`Failed to create directory ${dir}: ${mkdirError.message} (${mkdirError.code})`);
        }
      }
    } else if (error.code === 'EACCES') {
      throw new Error(`Permission denied accessing directory ${dir}`);
    } else if (error.code === 'ENOTDIR') {
      throw new Error(`Path ${dir} exists but is not a directory`);
    } else {
      throw new Error(`Error checking directory ${dir}: ${error.message} (${error.code})`);
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
    await fs.access(source);
    await fs.copyFile(source, destination);
    log(`Copied: ${path.basename(source)} -> ${destination}`, colors.green);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Source file not found: ${source}`);
    }
    throw new Error(`Failed to copy ${source} to ${destination}: ${error.message}`);
  }
}

/**
 * Safely copies a large file using streams for better memory efficiency
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 * @throws {Error} If file copying fails
 */
async function copyLargeFile(source, destination) {
  try {
    // Check if source file exists
    await fs.access(source);
    
    // Use streams for large file copying
    await pipeline(
      fsSync.createReadStream(source),
      fsSync.createWriteStream(destination)
    );
    
    log(`Copied (streamed): ${path.basename(source)} -> ${destination}`, colors.green);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Source file not found: ${source}`);
    }
    throw new Error(`Failed to copy ${source} to ${destination}: ${error.message}`);
  }
}

/**
 * Updates package.json with linting scripts
 * @param {string} targetDir - Target directory containing package.json
 * @returns {boolean} Success status
 */
async function updatePackageJson(targetDir) {
  const packageJsonPath = path.join(targetDir, 'package.json');
  
  // Check if package.json exists
  try {
    await fs.access(packageJsonPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      log('No package.json found. Please run npm init first.', colors.red);
    } else {
      log(`Cannot access package.json: ${error.message}`, colors.red);
    }
    return false;
  }
  
  try {
    // Read package.json with proper error handling
    const data = await fs.readFile(packageJsonPath, 'utf8');
    
    let packageJson;
    try {
      packageJson = JSON.parse(data);
    } catch (parseError) {
      log(`Error: package.json contains invalid JSON: ${parseError.message}`, colors.red);
      log('Please check your package.json file for syntax errors.', colors.yellow);
      return false;
    }
    
    // Add scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['lint:md'] = 'markdownlint "*.md" "docs/*.md"';
    packageJson.scripts['lint:js'] = 'eslint --ext .js,.jsx,.ts,.tsx .';
    packageJson.scripts.lint = 'npm run lint:md && npm run lint:js';
    
    // Write updated package.json with proper error handling
    try {
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        'utf8'
      );
    } catch (writeError) {
      if (writeError.code === 'EACCES') {
        log(`Permission denied writing to package.json. Please check file permissions.`, colors.red);
      } else {
        log(`Error writing package.json: ${writeError.message}`, colors.red);
      }
      return false;
    }
    
    log('Updated package.json with linting scripts', colors.green);
    return true;
  } catch (error) {
    log(`Unexpected error updating package.json: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Installs development dependencies safely
 * @param {string[]} dependencies - Array of dependency names to install
 * @returns {Promise<boolean>} Success status
 */
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

/**
 * Performs rollback of setup-standards operations
 * @param {string} targetDir - The target directory where standards were being applied
 * @param {Object} config - Configuration object with file lists
 */
async function performSetupRollback(targetDir, config) {
  log('Starting setup rollback...', colors.yellow);
  
  const rollbackOperations = [];
  const filesToRemove = [];
  
  // List of files that might have been created
  const potentialFiles = [
    path.join(targetDir, '.eslintrc.js'),
    ...config.configFiles.map(file => path.join(targetDir, file)),
    ...config.standardsFiles.map(file => path.join(targetDir, 'docs', 'standards', file))
  ];
  
  // Check which files exist and can be removed
  for (const filePath of potentialFiles) {
    try {
      await fs.access(filePath);
      filesToRemove.push(filePath);
    } catch (error) {
      // File doesn't exist, nothing to remove
    }
  }
  
  // Remove files that were created by this script
  let removedCount = 0;
  for (const filePath of filesToRemove) {
    try {
      await fs.unlink(filePath);
      rollbackOperations.push(`Removed: ${path.relative(targetDir, filePath)}`);
      removedCount++;
    } catch (error) {
      rollbackOperations.push(`Failed to remove: ${path.relative(targetDir, filePath)} (${error.message})`);
    }
  }
  
  // Try to remove empty directories created by this script
  const dirsToRemove = [
    path.join(targetDir, 'docs', 'standards'),
    path.join(targetDir, 'docs')
  ];
  
  for (const dirPath of dirsToRemove) {
    try {
      await fs.access(dirPath);
      const items = await fs.readdir(dirPath);
      if (items.length === 0) {
        await fs.rmdir(dirPath);
        rollbackOperations.push(`Removed empty directory: ${path.relative(targetDir, dirPath)}`);
      } else {
        rollbackOperations.push(`Directory not empty, keeping: ${path.relative(targetDir, dirPath)}`);
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
    }
  }
  
  // Report rollback results
  if (rollbackOperations.length > 0) {
    log('\nRollback summary:', colors.cyan);
    rollbackOperations.forEach(operation => {
      log(`  - ${operation}`, colors.gray);
    });
    log(`\nRemoved ${removedCount} files during rollback`, colors.yellow);
  } else {
    log('No files to roll back', colors.yellow);
  }
  
  // Note about package.json
  log('\nNote: package.json modifications were not rolled back to prevent data loss.', colors.yellow);
  log('Please manually review and revert package.json changes if needed.', colors.yellow);
  
  log('\nTo try setup again:', colors.yellow);
  log('  node setup-standards.js', colors.yellow);
}

/**
 * Main entry point for the setup-standards script
 * Validates target directory and applies REST-Base standards to an existing project
 * @returns {Promise<void>}
 */
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
    log('Step 1/5: Setting up directories...', colors.cyan);
    // Create directories
    await createDirectory(path.join(targetDir, 'docs'));
    await createDirectory(standardsDir);
    log('✓ Directories created', colors.green);
    
    log('Step 2/5: Copying standards documentation...', colors.cyan);
    // Copy standards files
    await Promise.all(config.standardsFiles.map(async (file) => {
      const source = path.join(scriptsDir, file);
      const destination = path.join(standardsDir, file);
      await copyFile(source, destination);
    }));
    log('✓ Standards documentation copied', colors.green);
    
    log('Step 3/5: Copying configuration files...', colors.cyan);
    // Copy config files
    await Promise.all(config.configFiles.map(async (file) => {
      const source = path.join(scriptsDir, file);
      const destination = path.join(targetDir, file);
      await copyFile(source, destination);
    }));
    log('✓ Configuration files copied', colors.green);
  
    log('Step 4/5: Creating ESLint configuration...', colors.cyan);
    // Create ESLint config using cached configuration
    const eslintConfig = getEslintConfig();

    await fs.writeFile(path.join(targetDir, '.eslintrc.js'), eslintConfig);
    log('Created .eslintrc.js', colors.green);
    log('✓ ESLint configuration created', colors.green);
    
    log('Step 5/5: Installing development dependencies...', colors.cyan);
    // Update package.json
    const packageUpdated = await updatePackageJson(targetDir);
    
    // Install dependencies
    if (packageUpdated) {
      await installDependencies(config.dependencies.dev);
    }
    log('✓ Dependencies installed', colors.green);
    
    log('\n🎉 Setup complete! Standards have been incorporated into your project.', colors.green);
    log('To get started with the standards, run: npm run lint', colors.yellow);
  } catch (error) {
    log(`\nError during setup: ${error.message}`, colors.red);
    
    // Perform rollback
    await performSetupRollback(targetDir, config);
    
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});