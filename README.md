# REST Base


## Table of Contents

- [Purpose](#purpose)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Contents](#contents)
- [Using These Standards in Your Projects](#using-these-standards-in-your-projects)
  - [Option 1: Use the NPM Package (Recommended)](#option-1-use-the-npm-package-recommended)
  - [Option 2: Clone and Copy](#option-2-clone-and-copy)
  - [Option 3: Use as a Template Repository](#option-3-use-as-a-template-repository)
- [Running the Scripts Locally](#running-the-scripts-locally)
- [Documentation Navigation](#documentation-navigation)
  - [Standards and Guidelines](#standards-and-guidelines)
  - [API Design](#api-design)
  - [Development Tools](#development-tools)
  - [Project Management](#project-management)
- [API Documentation Generator](#api-documentation-generator)
- [Keyboard Shortcuts and Accessibility](#keyboard-shortcuts-and-accessibility)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
    - [Node.js version error](#nodejs-version-error)
    - [Permission denied when installing globally](#permission-denied-when-installing-globally)
    - [Git not initialized](#git-not-initialized)
    - [ESLint errors after project creation](#eslint-errors-after-project-creation)
  - [Getting Help](#getting-help)
- [Contributing](#contributing)
- [License](#license)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.11.0%20(LTS)-brightgreen.svg)](https://nodejs.org)
[![npm version](https://img.shields.io/npm/v/rest-spec.svg)](https://www.npmjs.com/package/rest-spec)

An opinionated standard for RESTful API projects built with Node.js.

## Purpose

This repository contains comprehensive standards, guidelines, and conventions for building Node.js-based RESTful APIs.
It serves as a starting point and reference for teams wanting to establish consistent practices across projects.

## Prerequisites

Before using REST Base, ensure you have the following installed:

- **Node.js**: Version 22.11.0 or higher (Current LTS) ([Download here](https://nodejs.org))
- **npm**: Comes bundled with Node.js
- **Git**: For version control ([Download here](https://git-scm.com))
- **MySQL/MariaDB**: If using database features (optional)

## Quick Start

Get up and running with a new REST API project in under 2 minutes:

```bash
# Install REST Base globally
npm install -g git+https://github.com/karlgroves/rest-base.git

# Create a new project
rest-base-create my-awesome-api

# Navigate to your project
cd my-awesome-api

# Install dependencies
npm install

# Start development server
npm run dev
```

Your API will be running at `http://localhost:3000` with a health check endpoint at `/api/health`.

## Contents

- **Architecture & Structure**: Guidelines for project structure, module organization, and code organization
- **Coding Standards**: Detailed style guides for JavaScript/Node.js development
- **API Design**: Conventions for endpoint design, request/response formats, and error handling
- **Database**: SQL design patterns and best practices
- **Security**: Guidelines for implementing secure APIs

## Using These Standards in Your Projects

There are several ways to incorporate these standards into your projects:

### Option 1: Use the NPM Package (Recommended)

1. Install this package globally:

   ```bash
   npm install -g git+https://github.com/karlgroves/rest-base.git
   ```

2. Create a new project with all standards pre-applied:

   ```bash
   rest-base-create my-new-project
   ```

3. Or apply standards to an existing project:

   ```bash
   cd existing-project
   rest-base-setup
   ```

### Option 2: Clone and Copy

1. Clone this repository:

   ```bash
   git clone https://github.com/karlgroves/rest-base.git
   ```

2. Copy the relevant documentation files into your project:

   ```bash
   mkdir -p my-project/docs/standards
   cp rest-base/*.md my-project/docs/standards/
   ```

### Option 3: Use as a Template Repository

1. Click the "Use this template" button on GitHub to create a new repository based on this one.
2. Customize the standards to fit your specific project's needs.

## Running the Scripts Locally

If you've cloned this repository, you can also use the scripts directly:

```bash
# Create a new project
npm run create-project my-new-project

# Setup standards in an existing project
npm run setup-standards ../path/to/existing-project
```

## Documentation Navigation

### Standards and Guidelines
- [📋 **Global Rules**](./global-rules.md) - Project-wide standards and conventions
- [🏗️ **Node.js Structure & Naming**](./node_structure_and_naming_conventions.md) - Code organization and naming conventions
- [🛡️ **Technologies**](./technologies.md) - Approved technologies, frameworks, and dependencies
- [📊 **SQL Standards**](./sql-standards-and-patterns.md) - Database design patterns and SQL conventions

### API Design
- [🔄 **Operations & Responses**](./operations-and-responses.md) - REST API response formats and patterns
- [📨 **Request Patterns**](./request.md) - API request structure and conventions
- [✅ **Validation**](./validation.md) - Input validation requirements and patterns

### Development Tools
- [⚙️ **CLI API Documentation**](./CLI-API-DOCUMENTATION.md) - Complete guide to REST-SPEC CLI tools
- [⌨️ **Keyboard Shortcuts**](./KEYBOARD-SHORTCUTS.md) - Keyboard navigation and accessibility shortcuts
- [🤖 **CLAUDE.md**](./CLAUDE.md) - Guidelines for AI assistants working with this codebase
- [🎨 **Visual Design Requirements**](./visual-design-requirements.md) - UI/UX standards and guidelines

### Project Management
- [📝 **TODO List**](./todo.md) - Current development tasks and improvements

## API Documentation Generator

REST-SPEC includes a powerful API documentation generator that automatically creates comprehensive documentation from your Express.js routes.

### Features

- **🔍 Automatic Route Discovery**: Scans your project for Express route definitions
- **📄 Multiple Output Formats**: OpenAPI 3.0 (JSON/YAML), Markdown, and HTML
- **💬 JSDoc Support**: Extracts documentation from JSDoc comments
- **🎯 Smart Parameter Detection**: Automatically identifies path and query parameters
- **🏷️ Tag-based Organization**: Group endpoints by tags for better organization

### Quick Start

```bash
# Generate documentation for your project
npx rest-spec-api-doc

# Specify custom options
npx rest-spec-api-doc --output ./docs/api --format openapi

# Use configuration file
npx rest-spec-api-doc --config api-doc.config.json
```

### Example JSDoc Annotation

```javascript
/**
 * @route GET /api/users
 * @summary Get all users
 * @description Retrieves a paginated list of all users
 * @tag Users
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @response 200 - Successful response
 * @response 401 - Unauthorized
 * @security bearerAuth
 */
router.get('/users', authenticate, async (req, res) => {
  // Route implementation
});
```

For complete documentation, see the [API Documentation Generator Guide](./docs/api-documentation-generator.md).

## Keyboard Shortcuts and Accessibility

The REST-SPEC CLI tools are designed with accessibility in mind and support extensive keyboard navigation:

- **⌨️ Full Keyboard Navigation**: All CLI features are accessible via keyboard shortcuts
- **♿ Screen Reader Support**: Built-in accessibility mode for screen reader users
- **🎨 High Contrast Mode**: Multiple color themes including high contrast and colorblind-friendly options
- **⚡ Auto-completion**: Shell completion support for bash, zsh, and fish

### Key Features:

- **Interactive Mode**: Navigate menus with arrow keys, select with Space, confirm with Enter
- **Tab Completion**: Auto-complete commands, options, and file paths
- **Accessibility Mode**: Set `A11Y_MODE=1` for optimal screen reader experience
- **Command History**: Use Ctrl+R for reverse search through command history

For a complete guide to keyboard shortcuts and accessibility features, see the [Keyboard Shortcuts Documentation](./KEYBOARD-SHORTCUTS.md).

## Troubleshooting

### Common Issues

#### Node.js version error

```bash
Error: This package requires Node.js >= 22.11.0
```

Solution: Update Node.js to version 22.11.0 or higher using [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm). Use `nvm install --lts` to install the latest LTS version.

#### Permission denied when installing globally

```bash
EACCES: permission denied
```

Solution: Use `sudo npm install -g` or configure npm to use a different directory for global packages.

#### Git not initialized

```bash
Warning: Could not initialize Git repository
```

Solution: Ensure Git is installed and configured with your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### ESLint errors after project creation

```bash
npm run lint
```

If you encounter linting errors, most can be auto-fixed with:

```bash
npm run lint:js -- --fix
```

### Getting Help

- Check the [documentation files](#standards-files) for detailed guidelines
- Review the generated project structure and example code
- Submit issues on [GitHub](https://github.com/karlgroves/rest-base/issues)

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
