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

* Always generate unit tests for new code. Tests should:
* Follow the appropriate framework (e.g. Jest, Pytest, Mocha, JUnit).
* Cover happy paths, edge cases, and error conditions.
* Use descriptive test names.
* If mocking/stubbing is needed, use idiomatic libraries for the language.

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
