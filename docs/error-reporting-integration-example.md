# Error Reporting Integration Example

This guide shows how to integrate the error reporting system into existing REST-SPEC CLI scripts.

## Quick Start

### 1. Import the Error Reporter

```javascript
const errorReporter = require('../shared/error-reporter');
const { ErrorCategory } = require('../shared/error-reporter');
```

### 2. Wrap Your Main Function

```javascript
// Original main function
async function main() {
  // Your CLI logic here
}

// Wrap with error boundary
const wrappedMain = errorReporter.createErrorBoundary(main, 'your-command-name');

// Execute
wrappedMain().catch(async (error) => {
  await errorReporter.report(error, {
    command: 'your-command-name:fatal',
    fatal: true
  });
  process.exit(1);
});
```

### 3. Categorize Known Errors

```javascript
function validateInput(input) {
  if (!input) {
    const error = new Error('Input is required');
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }
}
```

### 4. Report Errors with Context

```javascript
try {
  await riskyOperation();
} catch (error) {
  await errorReporter.report(error, {
    command: 'command-name:operation',
    context: {
      input: sanitizedInput,
      stage: 'processing',
      attemptNumber: retryCount
    }
  });
  throw error; // Re-throw if operation should fail
}
```

## Complete Example: Enhanced Setup Standards

```javascript
#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const errorReporter = require('../shared/error-reporter');
const { ErrorCategory } = require('../shared/error-reporter');
const logger = require('../shared/logger');

async function copyStandardsFiles(targetDir) {
  const files = ['global-rules.md', 'node-standards.md'];
  
  for (const file of files) {
    try {
      const source = path.join(__dirname, '..', file);
      const dest = path.join(targetDir, 'docs', 'standards', file);
      
      await fs.copyFile(source, dest);
      logger.success(`Copied ${file}`);
    } catch (error) {
      // Categorize the error
      if (error.code === 'ENOENT') {
        error.category = ErrorCategory.FILE_ERROR;
      } else if (error.code === 'EACCES') {
        error.category = ErrorCategory.PERMISSION_ERROR;
      }
      
      // Report with context
      await errorReporter.report(error, {
        command: 'setup-standards:copy',
        context: {
          file,
          source: path.join(__dirname, '..', file),
          destination: dest,
          targetDir
        }
      });
      
      // User-friendly message
      logger.error(`Failed to copy ${file}: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    const error = new Error('Please provide a target directory');
    error.category = ErrorCategory.USER_ERROR;
    throw error;
  }
  
  const targetDir = path.resolve(args[0]);
  
  logger.heading('Setting up REST-SPEC standards');
  
  try {
    // Verify target directory
    await fs.access(targetDir);
    
    // Create standards directory
    const docsDir = path.join(targetDir, 'docs', 'standards');
    await fs.mkdir(docsDir, { recursive: true });
    
    // Copy files
    await copyStandardsFiles(targetDir);
    
    logger.success('Standards setup complete!');
  } catch (error) {
    // Error already reported in copyStandardsFiles
    throw error;
  }
}

// Wrap with error boundary
const wrappedMain = errorReporter.createErrorBoundary(main, 'setup-standards');

// Execute
wrappedMain();
```

## Error Dashboard Usage

After integrating error reporting, use the dashboard to monitor issues:

```bash
# View error summary
npm run error:summary

# Generate full dashboard
npm run error:dashboard

# Analyze error patterns
npm run error:analyze

# Or use the CLI directly
rest-spec-errors summary
rest-spec-errors dashboard
rest-spec-errors analyze --verbose
```

## Best Practices Summary

1. **Always wrap main functions** with error boundaries
2. **Categorize errors** appropriately for better analysis
3. **Provide context** without exposing sensitive data
4. **Use meaningful error messages** for users
5. **Test error scenarios** during development
6. **Monitor error patterns** regularly
7. **Clean up old reports** periodically

## Environment Variables

* `REST_SPEC_ERROR_REPORTING=false` - Disable error reporting
* `NODE_ENV=development` - Enable detailed error information
* `VERBOSE=true` - Show verbose error details
