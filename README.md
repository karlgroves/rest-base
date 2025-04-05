# REST Base

An opinionated standard for RESTful API projects built with Node.js.

## Purpose

This repository contains comprehensive standards, guidelines, and conventions for building Node.js-based RESTful APIs.
It serves as a starting point and reference for teams wanting to establish consistent practices across projects.

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

- `node_structure_and_naming_conventions.md` - Node.js coding standards
- `sql-standards-and-patterns.md` - Database design and SQL standards
- `technologies.md` - Approved technologies and dependencies
- `operations-and-responses.md` - API response formats
- `request.md` - API request patterns
- `validation.md` - Input validation requirements
- `global-rules.md` - Project-wide standards
- `CLAUDE.md` - Guide for AI assistants working with the codebase

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
