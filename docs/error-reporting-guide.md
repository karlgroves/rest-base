# Error Reporting System Guide

## Overview

The REST-SPEC error reporting system provides comprehensive error tracking, categorization, and analysis for all CLI tools. It helps improve tool reliability by capturing detailed error information while protecting user privacy.

## Features

### Error Categorization

Errors are automatically categorized into the following types:

* **USER_ERROR**: User input or usage errors
* **SYSTEM_ERROR**: System or environment errors
* **NETWORK_ERROR**: Network related errors
* **FILE_ERROR**: File system errors
* **PERMISSION_ERROR**: Permission related errors
* **DEPENDENCY_ERROR**: Missing or failed dependencies
* **UNEXPECTED_ERROR**: Unhandled or unknown errors
* **VALIDATION_ERROR**: Input validation errors
* **CONFIGURATION_ERROR**: Configuration errors

### Error Severity Levels

Each error is assigned a severity level:

* **LOW**: Minor issues that don't prevent operation
* **MEDIUM**: Issues that may affect functionality
* **HIGH**: Critical issues that prevent operation
* **CRITICAL**: System-wide failures

### Privacy Protection

The error reporter automatically sanitizes sensitive information:

* API keys and tokens
* Passwords and secrets
* Email addresses
* IP addresses
* File paths containing usernames
* Database connection strings
* Credit card numbers
* Social Security Numbers
* JWT tokens

## Usage

### Basic Error Reporting

```javascript
const errorReporter = require('./shared/error-reporter');

// Report an error
try {
  // Some operation
} catch (error) {
  await errorReporter.report(error, {
    command: 'my-command',
    context: { 
      input: userInput,
      config: currentConfig 
    },
    fatal: true
  });
}
```

### Error Boundaries

Wrap CLI commands with error boundaries for automatic error handling:

```javascript
const wrappedCommand = errorReporter.createErrorBoundary(
  myCommandFunction,
  'my-command'
);

// Execute with automatic error reporting
await wrappedCommand(args);
```

### Async Function Wrapper

For individual async functions:

```javascript
const wrappedFunction = errorReporter.wrapAsync(
  myAsyncFunction,
  'function-name'
);
```

## Error Dashboard

The error dashboard provides insights into error patterns and trends.

### Commands

```bash
# Show error summary
node scripts/error-dashboard.js summary

# Generate full dashboard
node scripts/error-dashboard.js dashboard

# Show recent errors
node scripts/error-dashboard.js recent

# Export error reports
node scripts/error-dashboard.js export errors.json

# Clean up old reports
node scripts/error-dashboard.js clean

# Analyze error patterns
node scripts/error-dashboard.js analyze
```

### Options

* `--verbose`: Show detailed error information
* `--help`: Show help message

## Integration Examples

### Enhanced Create Project Script

The `create-project-with-error-reporting.js` script demonstrates comprehensive error reporting integration:

```javascript
// Validate with error categorization
function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    const error = new Error("Project name cannot be empty");
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }
  // ... more validation
}

// Main function with error boundary
const wrappedMain = errorReporter.createErrorBoundary(main, 'create-project');
```

### Error Context

Always provide meaningful context:

```javascript
await errorReporter.report(error, {
  command: 'create-project',
  context: {
    projectName,
    projectDir,
    phase: 'structure-creation',
    attemptedOperation: 'mkdir'
  },
  fatal: true
});
```

## Environment Variables

* `REST_SPEC_ERROR_REPORTING`: Set to `false` to disable error reporting
* `NODE_ENV`: Set to `development` for detailed error information
* `VERBOSE`: Set to `true` for verbose logging

## Error Storage

Error reports are stored in the system's temporary directory:

* Location: `$TMPDIR/rest-spec-errors/`
* Format: `error-{id}-{timestamp}.json`
* Retention: Last 100 error reports are kept

## Best Practices

### 1. Categorize Errors Properly

```javascript
const error = new Error("Invalid configuration file");
error.category = ErrorCategory.CONFIGURATION_ERROR;
throw error;
```

### 2. Provide Meaningful Context

```javascript
error.context = {
  configFile: '/path/to/config.json',
  missingField: 'database.host',
  providedConfig: sanitizedConfig
};
```

### 3. Use Error Boundaries for Commands

```javascript
// Always wrap main CLI functions
const safeMain = errorReporter.createErrorBoundary(main, 'command-name');
```

### 4. Handle Cleanup on Errors

```javascript
try {
  await riskyOperation();
} catch (error) {
  await errorReporter.report(error, { command: 'my-command' });
  
  // Perform cleanup
  await cleanup();
  
  throw error;
}
```

### 5. User-Friendly Error Messages

```javascript
catch (error) {
  const report = await errorReporter.report(error, options);
  
  if (error.category === ErrorCategory.USER_ERROR) {
    logger.error("Invalid input provided");
    logger.info("Please check the documentation for correct usage");
  } else {
    logger.error("An unexpected error occurred");
    logger.info(`Error ID: ${report.id}`);
  }
}
```

## Monitoring and Analysis

### Regular Analysis

Run periodic error analysis to identify patterns:

```bash
# Weekly error analysis
node scripts/error-dashboard.js analyze --verbose
```

### Export for External Analysis

Export error data for analysis in other tools:

```bash
# Export as JSON
node scripts/error-dashboard.js export weekly-errors.json
```

### Key Metrics to Monitor

1. **Error Frequency**: Total errors over time
2. **Category Distribution**: Which types of errors are most common
3. **Command Performance**: Which commands generate the most errors
4. **Severity Trends**: Are critical errors increasing?
5. **User vs System Errors**: Ratio indicates whether issues are usage-related or bugs

## Troubleshooting

### Error Reporting Not Working

1. Check if error reporting is enabled:

   ```bash
   echo $REST_SPEC_ERROR_REPORTING
   ```

2. Verify temp directory permissions:

   ```bash
   ls -la $TMPDIR/rest-spec-errors/
   ```

3. Enable verbose logging:

   ```bash
   VERBOSE=true node your-script.js
   ```

### Too Many Error Reports

Clean up old reports:

```bash
node scripts/error-dashboard.js clean
```

### Sensitive Data in Reports

The error reporter automatically sanitizes common sensitive patterns. To add custom patterns:

```javascript
// In error-reporter.js, add to PRIVACY_PATTERNS
/your-custom-pattern/gi
```

## Contributing

When adding new CLI tools or commands:

1. Always use error boundaries for main functions
2. Categorize errors appropriately
3. Provide meaningful error context
4. Test error scenarios
5. Document expected errors in your code

## Security Considerations

* Error reports never contain raw sensitive data
* Reports are stored in user-specific temp directories
* Old reports are automatically cleaned up
* Error reporting can be completely disabled
* No data is sent to external services

## Future Enhancements

Planned improvements to the error reporting system:

1. **Error Aggregation**: Group similar errors automatically
2. **Trend Alerts**: Notify when error rates spike
3. **Integration Hooks**: Allow custom error handlers
4. **Report Templates**: Customizable report formats
5. **Performance Metrics**: Track operation timings
6. **Recovery Suggestions**: AI-powered fix suggestions
