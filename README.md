# REST Base

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen.svg)](https://nodejs.org)
[![npm version](https://img.shields.io/npm/v/rest-spec.svg)](https://www.npmjs.com/package/rest-spec)

An opinionated standard for RESTful API projects built with Node.js.

## Purpose

This repository contains comprehensive standards, guidelines, and conventions for building Node.js-based RESTful APIs.
It serves as a starting point and reference for teams wanting to establish consistent practices across projects.

## Prerequisites

Before using REST Base, ensure you have the following installed:

- **Node.js**: Version 22.12.0 or higher ([Download here](https://nodejs.org))
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

## Standards Files

The key standards files in this repository are:

- [`node_structure_and_naming_conventions.md`](./node_structure_and_naming_conventions.md) - Node.js coding standards
- [`sql-standards-and-patterns.md`](./sql-standards-and-patterns.md) - Database design and SQL standards
- [`technologies.md`](./technologies.md) - Approved technologies and dependencies
- [`operations-and-responses.md`](./operations-and-responses.md) - API response formats
- [`request.md`](./request.md) - API request patterns
- [`validation.md`](./validation.md) - Input validation requirements
- [`global-rules.md`](./global-rules.md) - Project-wide standards
- [`CLAUDE.md`](./CLAUDE.md) - Guide for AI assistants working with the codebase

## Troubleshooting

### Common Issues

#### Node.js version error

```bash
Error: This package requires Node.js >= 22.12.0
```

Solution: Update Node.js to version 22.12.0 or higher using [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm).

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
