# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Standards Reference

This project uses Node.js 22.x LTS (version 22.11.0) as defined in .nvmrc and requires Node.js >=22.11.0 (see
package.json engines field). Node.js 22.x "Jod" is the current LTS with Active support until October 2025 and
Maintenance support until April 2027.

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

## General Principles

- **Readability First**: Always prefer readable, clean, and maintainable code over brevity
- **Self-Documenting**: Write code as if it will be read and modified by others unfamiliar with the problem domain
- **Meaningful Names**: Generate self-documenting code with meaningful variable, function, and class names
- **Least Surprise**: Apply the principle of least surprise - avoid unconventional patterns without justification

## Key Code Style Principles

- **Formatting**: 2 spaces indentation, 100 char line length, Unix LF line endings
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Variables**: Use `const` by default, `let` when needed, never `var`
- **Imports**: Group by type (npm packages first, then local files)
- **Error Handling**: Always use try/catch with proper logging (Bunyan)
- **Documentation**: JSDoc comments required for all files and functions
- **Security**: Follow Express security best practices, validate all inputs
- **Database**: Use parameterized queries, follow SQL naming conventions
- **Line Wrapping**: Wrap lines at 80-100 characters unless necessary
- **Quotes**: Use single quotes consistently per JavaScript conventions

## Comments and Documentation Standards

- **JSDoc Required**: Always include JSDoc/TypeDoc-style comments for public functions, methods, and classes
- **File Headers**: Include a file/module header describing purpose and usage when applicable
- **Explain Why**: Inline comments should explain why something is done, not what is obvious from the code
- **Mark Issues**: Mark TODOs, FIXMEs, or assumptions clearly
- **Documentation Focus**: Comments are the cornerstone of easier maintenance - take a liberal approach to commenting

## Git Flow Branching Strategy

This project follows **Git Flow** branching strategy. All development must adhere to this workflow:

### Branch Structure

- **main**: Production-ready code only. Direct commits are prohibited.
- **develop**: Integration branch for features. All feature branches merge here first.
- **feature/**: Feature development branches created from `develop`
- **release/**: Release preparation branches created from `develop`
- **hotfix/**: Critical fixes created from `main` for production issues

### Workflow Rules

- **New Features**: Create `feature/feature-name` branches from `develop`
- **Feature Completion**: Merge feature branches back to `develop` via pull request
- **Releases**: Create `release/version` branches from `develop` for final testing
- **Production**: Merge release branches to both `main` and `develop`
- **Critical Fixes**: Create `hotfix/fix-name` branches from `main`, merge to both `main` and `develop`

### Branch Naming Conventions

- Features: `feature/add-user-authentication`, `feature/implement-rest-api`
- Releases: `release/v1.2.0`, `release/v2.0.0-beta`
- Hotfixes: `hotfix/fix-login-vulnerability`, `hotfix/patch-memory-leak`

### Development Workflow

1. Always start feature work from the latest `develop` branch
2. Create descriptive branch names that clearly indicate the feature or fix
3. Make focused commits with clear commit messages
4. Open pull requests for code review before merging to `develop`
5. Delete feature branches after successful merge
6. Never commit directly to `main` or `develop` - always use pull requests

## Task Management

This project uses `todo.md` as the primary task tracking system. When working on tasks:

- Always check `todo.md` for the current list of uncompleted tasks
- Remove completed tasks from the file rather than just marking them as done
- Commit and push changes to `todo.md` after updating task status
- Work through tasks systematically, completing each one before moving to the next
- Use the TodoWrite tool to maintain an active task list during development sessions
- Mark tasks as completed immediately after finishing them, then commit and push changes

## Output Format Guidelines

- **Code Blocks**: Always produce code blocks with valid syntax highlighting markdown (e.g., ```javascript)
- **Language Separation**: Do not mix unrelated languages in one code block unless necessary
- **Multi-File Output**: If output is multi-file, specify filenames and directory structure clearly
- **Accessibility**: Where requested, generate code that is accessible (e.g., ARIA roles in HTML, focus management in JS)
- **WCAG Compliance**: Ensure generated UI code complies with accessibility standards (WCAG 2.1 AA)

## When in Doubt

- **Clarity Over Cleverness**: If a design choice could be ambiguous, prefer clarity over cleverness
- **Offer Alternatives**: Offer alternatives in comments or notes if multiple approaches are equally valid
