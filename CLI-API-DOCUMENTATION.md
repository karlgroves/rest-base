# CLI API Documentation

> **Navigation:** [📖 Main Documentation](./README.md#documentation-navigation) | [📋 Global Rules](./global-rules.md) |
> [🏗️ Node.js Standards](./node_structure_and_naming_conventions.md) |
> [⌨️ Keyboard Shortcuts](./KEYBOARD-SHORTCUTS.md) |
> [🤖 CLAUDE.md](./CLAUDE.md)

## Table of Contents

- [Overview](#overview)
- [create-project.js](#create-projectjs)
  - [Purpose](#create-project-purpose)
  - [Usage](#create-project-usage)
  - [Parameters](#create-project-parameters)
  - [Project Name Validation Rules](#project-name-validation-rules)
  - [Example](#create-project-example)
  - [Process Flow](#create-project-process-flow)
  - [Generated Project Structure](#generated-project-structure)
  - [Dependencies Installed](#create-project-dependencies-installed)
    - [Production Dependencies](#production-dependencies)
    - [Development Dependencies](#development-dependencies)
  - [Error Handling](#create-project-error-handling)
  - [Security Features](#security-features)
- [setup-standards.js](#setup-standardsjs)
  - [Purpose](#setup-standards-purpose)
  - [Usage](#setup-standards-usage)
  - [Parameters](#setup-standards-parameters)
  - [Example](#setup-standards-example)
  - [Process Flow](#setup-standards-process-flow)
  - [Files Created/Modified](#files-createdmodified)
    - [New Files](#new-files)
    - [Modified Files](#modified-files)
  - [Package.json Scripts Added](#packagejson-scripts-added)
  - [Dependencies Installed](#setup-standards-dependencies-installed)
  - [Prerequisites](#setup-standards-prerequisites)
  - [Error Handling](#setup-standards-error-handling)
  - [Rollback Features](#rollback-features)
- [Common Features](#common-features)
  - [Progress Indicators](#progress-indicators)
  - [Performance Optimizations](#performance-optimizations)
  - [Security Measures](#security-measures)
  - [Error Recovery](#error-recovery)
- [Exit Codes](#exit-codes)
  - [create-project.js](#create-projectjs-exit-codes)
  - [setup-standards.js](#setup-standardsjs-exit-codes)
- [Environment Requirements](#environment-requirements)
- [Keyboard Shortcuts and Accessibility](#keyboard-shortcuts-and-accessibility)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
    - ["Project directory already exists"](#project-directory-already-exists)
    - ["No package.json found"](#no-packagejson-found)
    - ["Permission denied"](#permission-denied)
    - ["Git initialization failed"](#git-initialization-failed)
    - ["Dependency installation failed"](#dependency-installation-failed)
  - [Debug Information](#debug-information)
- [API Function Reference](#api-function-reference)
  - [create-project.js Functions](#create-projectjs-functions)
    - [Core Functions](#create-project-core-functions)
    - [Utility Functions](#create-project-utility-functions)
  - [setup-standards.js Functions](#setup-standardsjs-functions)
    - [Core Functions](#setup-standards-core-functions)
    - [Utility Functions](#setup-standards-utility-functions)

This document provides comprehensive API documentation for the REST-SPEC CLI tools.

## Overview

The REST-SPEC project provides two main CLI tools for setting up and managing Node.js projects that follow
REST-Base standards:

1. **create-project.js** - Creates new projects from scratch with all standards pre-applied
2. **setup-standards.js** - Applies REST-Base standards to existing projects

## create-project.js

### create-project Purpose

Creates a new Node.js RESTful API project with REST-Base standards pre-applied, including directory structure,
configuration files, and boilerplate code.

### create-project Usage

```bash
node scripts/create-project.js <project-name>
```

### create-project Parameters

- `<project-name>` (required): Name of the project to create

### Project Name Validation Rules

- Must be a non-empty string
- Cannot contain special characters: `<>:"|?*;\\&$`(){}[]!`
- Cannot start with a dot (.)
- Cannot be a reserved system name (con, prn, aux, etc.)
- Cannot contain path separators or parent directory references
- Must be 214 characters or less
- Cannot contain URL-encoded characters

### create-project Example

```bash
node scripts/create-project.js my-api-project
```

### create-project Process Flow

1. **Phase 1/3**: Creates project structure, package.json, and README.md in parallel
2. **Phase 2/3**: Copies standards files, config files, and creates app files in parallel  
3. **Phase 3/3**: Initializes Git repository with initial commit

### Generated Project Structure

```text
my-api-project/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   │   └── errorHandler.js
│   ├── models/
│   ├── routes/
│   │   └── index.js
│   ├── services/
│   ├── utils/
│   │   └── logger.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   └── standards/
│       ├── node_structure_and_naming_conventions.md
│       ├── sql-standards-and-patterns.md
│       ├── technologies.md
│       ├── operations-and-responses.md
│       ├── request.md
│       ├── validation.md
│       ├── global-rules.md
│       └── CLAUDE.md
├── public/
│   ├── images/
│   ├── styles/
│   └── scripts/
├── .eslintrc.js
├── .env.example
├── .gitignore
├── .markdownlint.json
├── package.json
└── README.md
```

### create-project Dependencies Installed

#### Production Dependencies

- bcrypt ^5.1.1
- cors ^2.8.5
- dotenv ^16.3.1
- express ^4.18.2
- express-validator ^7.0.1
- helmet ^7.1.0
- joi ^17.11.0
- jsonwebtoken ^9.0.2
- morgan ^1.10.0
- mysql2 ^3.6.5
- sequelize ^6.35.1
- winston ^3.11.0

#### Development Dependencies

- eslint ^8.55.0
- eslint-config-airbnb-base ^15.0.0
- eslint-plugin-import ^2.29.0
- jest ^29.7.0
- markdownlint-cli ^0.37.0
- nodemon ^3.0.2
- supertest ^6.3.3

### create-project Error Handling

- **Invalid project name**: Exits with code 1 and shows validation error
- **Directory already exists**: Exits with code 1
- **Creation failure**: Performs comprehensive rollback and exits with code 1
- **File operation errors**: Detailed error messages with specific file paths

### Security Features

- Input validation prevents command injection
- Path validation prevents directory traversal
- Secure spawn execution prevents shell injection
- Reserved name checking prevents system conflicts

---

## setup-standards.js

### setup-standards Purpose

Applies REST-Base standards to an existing Node.js project by copying documentation, configuration files,
and setting up development dependencies.

### setup-standards Usage

```bash
node scripts/setup-standards.js [target-directory]
```

### setup-standards Parameters

- `[target-directory]` (optional): Directory to apply standards to (defaults to current directory)

### setup-standards Example

```bash
# Apply to current directory
node scripts/setup-standards.js

# Apply to specific directory
node scripts/setup-standards.js ./my-existing-project
```

### setup-standards Process Flow

1. **Step 1/5**: Creates docs/standards directories
2. **Step 2/5**: Copies standards documentation files in parallel
3. **Step 3/5**: Copies configuration files (.gitignore, .markdownlint.json) in parallel
4. **Step 4/5**: Creates ESLint configuration
5. **Step 5/5**: Updates package.json and installs development dependencies

### Files Created/Modified

#### New Files

- `docs/standards/` directory with all standards documentation
- `.eslintrc.js` with Airbnb base configuration
- `.markdownlint.json` (if not exists)
- `.gitignore` (if not exists)

#### Modified Files

- `package.json` - Adds linting scripts and development dependencies

### Package.json Scripts Added

```json
{
  "scripts": {
    "lint:md": "markdownlint \"*.md\" \"docs/*.md\"",
    "lint:js": "eslint --ext .js,.jsx,.ts,.tsx .",
    "lint": "npm run lint:md && npm run lint:js"
  }
}
```

### setup-standards Dependencies Installed

- markdownlint-cli
- eslint  
- eslint-config-airbnb-base
- eslint-plugin-import

### setup-standards Prerequisites

- Existing package.json file
- Node.js and npm installed
- Write permissions to target directory

### setup-standards Error Handling

- **Missing package.json**: Shows error and exits gracefully
- **Permission errors**: Detailed error messages with permission guidance
- **Setup failure**: Performs rollback of created files and directories
- **Invalid target path**: Path validation prevents directory traversal

### Rollback Features

- Removes created files on error
- Removes empty directories created during setup
- Preserves package.json modifications (manual review recommended)
- Detailed rollback summary with affected files

---

## Common Features

### Progress Indicators

Both tools provide clear progress feedback:

- **create-project.js**: Phase indicators (1/3, 2/3, 3/3) with checkmarks
- **setup-standards.js**: Step indicators (1/5, 2/5, etc.) with checkmarks
- Colored output for better visual feedback
- Success/error status for each operation

### Performance Optimizations

- **Parallel Processing**: Independent operations run concurrently using Promise.all()
- **Intelligent File Copying**: Automatic selection between regular copy and streaming based on file size
- **Configuration Caching**: Frequently used configuration templates are cached in memory
- **Batched Operations**: Multiple file operations grouped for efficiency

### Security Measures

- Input validation on all user-provided parameters
- Path validation to prevent directory traversal attacks
- Command injection prevention in subprocess execution
- Reserved name checking to prevent system conflicts
- Secure spawn execution without shell access

### Error Recovery

- Comprehensive rollback mechanisms on failure
- Detailed error messages with actionable guidance
- Graceful handling of permission and file system errors
- Preservation of existing project state on setup failure

---

## Exit Codes

### create-project.js Exit Codes

- `0`: Success
- `1`: Invalid arguments, validation failure, or creation error

### setup-standards.js Exit Codes  

- `0`: Success
- `1`: Invalid arguments, missing prerequisites, or setup error

---

## Environment Requirements

- Node.js 22.x LTS or higher
- npm package manager
- Unix-like or Windows operating system
- Write permissions to target directories
- Git (optional, for repository initialization)

---

## Keyboard Shortcuts and Accessibility

The REST-SPEC CLI tools are designed with comprehensive keyboard navigation and accessibility support:

### Interactive Mode Navigation

- **Arrow Keys** (`↑`/`↓`): Navigate through menu options
- **Space**: Toggle selection in multi-select menus
- **Enter**: Confirm selection and proceed
- **Esc**: Cancel current operation
- **Tab/Shift+Tab**: Navigate between input fields

### Auto-Completion

All commands support tab completion for improved efficiency:

```bash
create-project --[Tab]  # Shows available options
setup-standards [Tab]   # Completes directory paths
```

### Accessibility Features

- **Screen Reader Mode**: Set `A11Y_MODE=1` for optimized screen reader output
- **High Contrast**: Set `REST_SPEC_THEME=high-contrast` for better visibility
- **Progress Announcements**: Automatic progress updates for screen reader users

### Quick Tips

- Use `--interactive` mode for guided setup with full keyboard navigation
- Enable verbose mode (`--verbose`) for detailed operation feedback
- All visual indicators have text alternatives for accessibility

For a comprehensive guide to all keyboard shortcuts, terminal navigation, and accessibility features,
see the [Keyboard Shortcuts Documentation](./KEYBOARD-SHORTCUTS.md).

---

## Troubleshooting

### Common Issues

#### "Project directory already exists"

**Solution**: Choose a different project name or remove the existing directory

#### "No package.json found"

**Solution**: Run `npm init` first or navigate to a directory with package.json

#### "Permission denied"

**Solution**: Check file/directory permissions or run with appropriate privileges

#### "Git initialization failed"

**Solution**: Configure Git user settings or skip Git initialization warning

#### "Dependency installation failed"

**Solution**: Check npm configuration and internet connectivity

### Debug Information

Both tools provide detailed logging including:

- File operation results
- Directory creation status  
- Dependency installation progress
- Error details with file paths
- Rollback operation summaries

---

## API Function Reference

### create-project.js Functions

#### create-project Core Functions

- `validateProjectName(name)` - Validates project name for security and compatibility
- `createProjectStructure(projectDir)` - Creates complete directory structure  
- `createPackageJson(projectDir, projectName)` - Generates package.json with dependencies
- `copyStandardsFiles(projectDir, sourceDir)` - Copies documentation files
- `copyConfigFiles(projectDir, sourceDir)` - Copies configuration files
- `createAppFiles(projectDir)` - Creates boilerplate application files
- `createReadme(projectDir, projectName)` - Generates project README
- `initGit(projectDir)` - Initializes Git repository

#### create-project Utility Functions  

- `log(message, color)` - Colored console logging
- `safeSpawn(args, cwd)` - Secure subprocess execution
- `copyFileIntelligent(source, destination, threshold)` - Smart file copying
- `performRollback(projectDir, projectName)` - Error recovery and cleanup
- `getEslintConfig()` - Cached ESLint configuration
- `getEnvExample()` - Cached environment template

### setup-standards.js Functions

#### setup-standards Core Functions

- `validateTargetPath(targetPath)` - Validates and normalizes target directory
- `createDirectory(dir)` - Safe directory creation with error handling
- `copyFile(source, destination)` - Standard file copying
- `copyLargeFile(source, destination)` - Streaming-based file copying
- `updatePackageJson(targetDir)` - Adds scripts and prepares for dependencies
- `installDependencies(dependencies)` - Safe npm dependency installation

#### setup-standards Utility Functions

- `log(message, color)` - Colored console logging  
- `validateDependencies(dependencies)` - Prevents malicious package names
- `safeNpmInstall(dependencies)` - Secure npm execution
- `performSetupRollback(targetDir, config)` - Error recovery and cleanup
- `getEslintConfig()` - Cached ESLint configuration

---

This documentation provides complete reference for using and understanding the REST-SPEC CLI tools.
For additional support, refer to the project's README.md and standards documentation in the `docs/standards/` directory.
