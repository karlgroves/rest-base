# CLAUDE Global

## General Principles

* Always prefer readable, clean, and maintainable code over brevity.
* Write code as if it will be read and modified by others unfamiliar with the problem domain.
* Generate self-documenting code: choose meaningful variable, function, and class names.
* Apply the principle of least surprise: avoid unconventional patterns without justification.

## Code Style

* Adhere to the language’s official style guide (e.g. PEP8 for Python, Airbnb or Google for JavaScript/TypeScript, PSR-12 for PHP).
* Use consistent indentation (e.g., 4 spaces in Python, 2 spaces in JavaScript/TypeScript).
* Wrap lines at 80-100 characters unless necessary.
* Prefer single quotes or double quotes consistently per language conventions.

## Comments and Documentation

* Always include docstrings or JSDoc/TypeDoc-style comments for public functions, methods, and classes.
* Include a file/module header describing purpose and usage, if applicable.
* Inline comments should explain why something is done, not what is obvious from the code.
* Mark TODOs, FIXMEs, or assumptions clearly.

## Testing

* Always apply Test-Driven Development (TDD): write tests before or alongside code to define expected behavior.
* Favor Behavior-Driven Development (BDD) where appropriate: tests should describe observable behavior rather than internal implementation details.
* Do not generate placeholder, empty, or fake tests (e.g., tests that contain expect(true).toBe(true) or meaningless assertions) simply to increase code coverage. All tests must assert real, verifiable behavior.
* Front-end tests must run in a real browser environment (e.g. via Puppeteer, Playwright) instead of jsdom or simulated DOM unless explicitly justified. This ensures accurate rendering, event handling, and accessibility testing.
* All tests must:
  * Have descriptive, human-readable names that clearly state the intent (e.g., “renders login form with empty fields by default” rather than “test1”).
  * Cover:
    * Happy paths
    * Common edge cases
    * Error and failure conditions
    * Avoid brittle selectors or overly tight coupling to non-essential implementation details (e.g., prefer testing via user-visible elements over internal class names).
* Never generate tests that pass without meaningful assertions or fabricate behavior the code does not provide.
* Tests must be runnable as-is with the specified tooling (no fictional libraries or APIs).
* Prefer integration-level tests for user interfaces that simulate real user interaction rather than isolated unit tests where feasible.
* For APIs:
  * Validate request/response structure, including headers, status codes, and body content.
  * Include tests for invalid inputs, authorization failures, and rate limiting or similar controls.
* Include code examples of running tests (e.g., npm test, pytest) if generating documentation alongside tests.
* Where mocking or stubbing is required:
  * Use realistic data structures — never make up object shapes or API fields that don’t exist.
  * Note assumptions or boundaries clearly in comments.
* If uncertain about exact behavior of external APIs or systems, generate TODO comments or request clarifications rather than inventing responses or mocks.

## Error Handling

* Prefer explicit error handling over silent failures (e.g., try/catch, Result/Either types).
* Never swallow exceptions without logging or justification.
* Validate input data before processing; fail fast and clearly.

## Security & Safety

* Avoid insecure practices by default
* Never include hard-coded secrets, API keys, or passwords.
* Sanitize and validate any user input.
* Use parameterized queries or ORM features to prevent SQL injection.
* Follow the principle of secure defaults.

## Performance

* Avoid premature optimization. But:
* Do not generate obviously inefficient code (e.g., nested O(n²) loops without explanation).
* Flag any potential bottlenecks with comments.

## Modularity & Design

* Generate small, focused functions that do one thing well.
* Prefer pure functions when possible (no side effects).
* Encourage separation of concerns (e.g., business logic separate from I/O).
* Use appropriate design patterns (e.g., Factory, Singleton) where justified.

## Dependencies

* Minimize external dependencies; justify when adding a dependency.
* Prefer well-maintained, popular libraries with permissive licenses.
* Always pin dependency versions in generated package files.

## Versioning & Compatibility

* Ensure generated code is compatible with the specified:
* Runtime (e.g., Python 3.11, Node.js 20)
* Framework (e.g., React 18, Django 4)
* Clearly indicate if code requires a specific environment or toolchain.

## Output Format

* Always produce code blocks in valid syntax highlighting markdown (e.g., ```python).
* Do not mix unrelated languages in one code block unless necessary.
* If output is multi-file, specify filenames and directory structure clearly.

## Non-Functional

* Where requested, generate code that is accessible (e.g., ARIA roles in HTML, focus management in JS).
* Ensure generated UI code complies with accessibility standards (WCAG 2.1 AA).

## When in Doubt

* If a design choice could be ambiguous, prefer clarity over cleverness.
* Offer alternatives in comments or notes if multiple approaches are equally valid.
