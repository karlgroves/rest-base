# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Standards Reference

This project contains comprehensive standards documentation that should be followed for all development:

- **Node.js Structure and Naming**: See `node_structure_and_naming_conventions.md` for detailed JavaScript/Node.js standards
- **SQL Standards**: See `sql-standards-and-patterns.md` for database design patterns and SQL coding standards
- **Technology Stack**: See `technologies.md` for approved technologies, libraries, and dependencies
- **API Design**: See `operations-and-responses.md` and `request.md` for REST API design patterns
- **Validation**: See `validation.md` for input validation requirements
- **Global Rules**: See `global-rules.md` for project-wide development standards

## Build/Test Commands

- **Run linting**: `npm run lint` or `eslint src/**/*.js`
- **Run type checking**: `npm run typecheck` or `tsc --noEmit`
- **Run all tests**: `npm test` or `jest`
- **Run single test**: `jest path/to/test-file.test.js` or `jest -t 'test description'`
- **Generate test coverage**: `npm run coverage` or `jest --coverage`

## Key Code Style Principles

- **Formatting**: 2 spaces indentation, 100 char line length, Unix LF line endings
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Variables**: Use `const` by default, `let` when needed, never `var`
- **Imports**: Group by type (npm packages first, then local files)
- **Error Handling**: Always use try/catch with proper logging (Bunyan/Winston)
- **Documentation**: JSDoc comments required for all files and functions
- **Security**: Follow Express security best practices, validate all inputs
- **Database**: Use parameterized queries, follow SQL naming conventions