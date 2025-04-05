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
const { execSync } = require('child_process');

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

function installDependencies(dependencies) {
  try {
    const command = `npm install --save-dev ${dependencies.join(' ')}`;
    log(`Installing dev dependencies: ${dependencies.join(', ')}`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error installing dependencies: ${error.message}`, colors.red);
    return false;
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || '.';
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
    installDependencies(config.dependencies.dev);
  }
  
  log('\nSetup complete! Standards have been incorporated into your project.', colors.green);
  log('To get started with the standards, run: npm run lint', colors.yellow);
}

main();