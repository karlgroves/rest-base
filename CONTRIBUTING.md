# Contributing to REST-SPEC

## Table of Contents

- [Development Process](#development-process)
  - [Code Changes Happen Through Pull Requests](#code-changes-happen-through-pull-requests)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
  - [Code Style](#code-style)
  - [Naming Conventions](#naming-conventions)
  - [Commit Messages](#commit-messages)
    - [Types](#types)
    - [Examples](#examples)
- [Testing](#testing)
  - [Test Types](#test-types)
  - [Writing Tests](#writing-tests)
  - [Running Tests](#running-tests)
- [Documentation](#documentation)
  - [Code Documentation](#code-documentation)
  - [README Updates](#readme-updates)
- [Security](#security)
  - [Security Guidelines](#security-guidelines)
  - [Reporting Security Issues](#reporting-security-issues)
- [Performance](#performance)
  - [Performance Considerations](#performance-considerations)
  - [Benchmarking](#benchmarking)
- [Pull Request Process](#pull-request-process)
  - [Before Submitting](#before-submitting)
  - [PR Description Template](#pr-description-template)
  - [Review Process](#review-process)
- [Issue Reporting](#issue-reporting)
  - [Bug Reports](#bug-reports)
  - [Feature Requests](#feature-requests)
  - [Question or Discussion](#question-or-discussion)
- [Code of Conduct](#code-of-conduct)
  - [Our Standards](#our-standards)
  - [Unacceptable Behavior](#unacceptable-behavior)
  - [Enforcement](#enforcement)
- [Recognition](#recognition)
- [Getting Help](#getting-help)
  - [Communication Channels](#communication-channels)
  - [Mentorship](#mentorship)
- [Release Process](#release-process)
  - [Versioning](#versioning)
  - [Release Cycle](#release-cycle)
- [License](#license)
- [Additional Resources](#additional-resources)

We love your input! We want to make contributing to REST-SPEC as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Code Changes Happen Through Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js ≥22.11.0 (LTS)
- npm (comes with Node.js)
- Git

### Local Development

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/REST-SPEC.git
   cd REST-SPEC
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up pre-commit hooks**

   ```bash
   npm run prepare
   ```

4. **Run tests to ensure everything works**

   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

### Project Structure

```text
REST-SPEC/
├── scripts/                 # CLI tools and utilities
│   ├── create-project.js   # Project creation script
│   ├── setup-standards.js  # Standards setup script
│   └── cli-enhancements.js # Enhanced CLI features
├── shared/                 # Shared utilities and modules
│   ├── config-loader.js   # Configuration management
│   ├── eslint-config.js   # ESLint configuration
│   ├── input-sanitizer.js # Input validation utilities
│   ├── secure-defaults.js # Security configuration defaults
│   └── logger.js          # Logging utility
├── templates/             # Project templates
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/            # End-to-end tests
├── docs/               # Documentation
└── *.md               # Standards and documentation files
```

## Development Guidelines

### Code Style

We use ESLint and Prettier to maintain consistent code style:

- **Indentation**: 2 spaces
- **Line Length**: 100 characters max
- **Quotes**: Single quotes for JavaScript, double quotes for JSON
- **Semicolons**: Required
- **Trailing Commas**: Required for multiline structures

### Naming Conventions

- **Variables/Functions**: camelCase (`getUserData`)
- **Classes**: PascalCase (`ConfigManager`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Files**: kebab-case (`user-service.js`)
- **Directories**: kebab-case (`user-management`)

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

#### Examples

```text
feat: add dry-run mode to CLI commands

fix(security): sanitize user input in project names

docs: update API documentation for new endpoints

test: add unit tests for input sanitizer

chore: update dependencies to latest versions
```

## Testing

### Test Types

1. **Unit Tests**: Test individual functions and modules
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete workflows

### Writing Tests

- Use Jest as the testing framework
- Place tests in the `tests/` directory
- Follow the naming pattern: `*.test.js`
- Aim for at least 70% code coverage
- Write descriptive test names

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/unit/config-loader.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Documentation

### Code Documentation

- Use JSDoc comments for all functions and classes
- Include parameter types and return types
- Provide examples for complex functions

```javascript
/**
 * Sanitizes a project name to prevent security vulnerabilities
 * @param {string} projectName - The project name to sanitize
 * @param {Object} options - Configuration options
 * @param {boolean} options.allowSpaces - Whether to allow spaces
 * @returns {string} The sanitized project name
 * @throws {Error} If project name is invalid
 * @example
 * const clean = sanitizeProjectName('my-project');
 */
function sanitizeProjectName(projectName, options = {}) {
  // Implementation
}
```

### README Updates

When adding new features, update the relevant documentation:

- Main README.md for user-facing changes
- Technical documentation for internal changes
- CLI documentation for new commands or options

## Security

### Security Guidelines

- Never commit secrets or API keys
- Validate all user inputs
- Use the provided security utilities in `/shared/`
- Follow the security checklist in `docs/security-checklist.md`

### Reporting Security Issues

Please report security vulnerabilities to <security@rest-spec.org>. Do not open public issues for security vulnerabilities.

## Performance

### Performance Considerations

- Prefer asynchronous operations for I/O
- Use streaming for large file operations
- Cache frequently accessed data
- Minimize dependencies

### Benchmarking

When making performance changes:

1. Create benchmarks for the affected code
2. Measure before and after performance
3. Include benchmark results in your PR

## Pull Request Process

### Before Submitting

1. **Update Documentation**: Ensure any new features are documented
2. **Add Tests**: Write tests for your changes
3. **Run the Full Test Suite**: `npm test && npm run lint && npm run typecheck`
4. **Check Security**: Run `npm audit` and fix any issues
5. **Update CHANGELOG**: Add your changes to the changelog (if applicable)

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Tests pass locally with my changes
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] Any dependent changes have been merged and published

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks**: All PRs must pass CI/CD checks
2. **Code Review**: At least one maintainer must approve
3. **Security Review**: Security-related changes require additional review
4. **Documentation Review**: Documentation changes are reviewed for clarity

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment**: Node.js version, OS, etc.
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Additional Context**: Any relevant information

### Feature Requests

Use the feature request template and include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives Considered**: Other approaches you've considered
- **Additional Context**: Any relevant information

### Question or Discussion

For general questions:

- Check existing documentation first
- Search existing issues
- Use GitHub Discussions for broader conversations
- Be specific about what you're trying to accomplish

## Code of Conduct

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Unacceptable Behavior

Examples of unacceptable behavior include:

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and are expected to take
appropriate action in response to unacceptable behavior.

## Recognition

Contributors who make significant improvements will be:

- Added to the contributors list
- Mentioned in release notes
- Invited to become maintainers (for consistent contributors)

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussion
- **Email**: <security@rest-spec.org> for security issues

### Mentorship

New contributors can request mentorship by:

1. Opening an issue tagged with "mentorship"
2. Describing your background and what you'd like to learn
3. A maintainer will be assigned to help guide your contribution

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Cycle

- **Regular Releases**: Monthly minor releases
- **Patch Releases**: As needed for critical bug fixes
- **Major Releases**: Annually or for significant breaking changes

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Additional Resources

- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JavaScript Style Guide](https://standardjs.com/)
- [Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [REST API Design Guidelines](https://restfulapi.net/)

---

Thank you for contributing to REST-SPEC! 🎉
