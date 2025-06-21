# CLI Enhancements

This document describes the enhanced CLI features available in REST-Base tools.

## Enhanced Commands

### `rest-base-create-enhanced`

Enhanced version of the project creation tool with additional features:

```bash
# Basic usage
rest-base-create-enhanced my-project

# With options
rest-base-create-enhanced my-project --template=microservice --dry-run --interactive

# Using config file
rest-base-create-enhanced my-project --config=./project-config.json
```

### `rest-base-setup-enhanced`

Enhanced version of the standards setup tool:

```bash
# Basic usage
rest-base-setup-enhanced

# With options
rest-base-setup-enhanced ./my-project --dry-run --interactive --backup

# Skip certain operations
rest-base-setup-enhanced --skip-deps --skip-config
```

## CLI Features

### Dry-Run Mode

Preview what operations will be performed without making actual changes:

```bash
rest-base-create-enhanced my-project --dry-run
```

**Features:**

- Shows all operations that would be performed
- Displays file/directory changes
- Lists dependencies that would be installed
- Safe to run multiple times

### Interactive Mode

Step-by-step guided setup with prompts:

```bash
rest-base-create-enhanced --interactive
```

**Features:**

- Prompts for project name if not provided
- Template selection menu
- Confirmation prompts for each operation
- User-friendly error messages

### Template System

Choose from predefined project templates:

```bash
rest-base-create-enhanced my-project --template=microservice
```

**Available Templates:**

| Template       | Description               | Key Features                         |
| -------------- | ------------------------- | ------------------------------------ |
| `microservice` | Microservice architecture | Message queuing, Docker, Redis       |
| `api-gateway`  | API Gateway service       | Rate limiting, authentication, proxy |
| `graphql`      | GraphQL API               | Apollo Server, schema management     |
| `websocket`    | WebSocket server          | Socket.IO, room management           |

### Rollback Support

Automatic backup and rollback functionality:

```bash
rest-base-setup-enhanced --backup
```

**Features:**

- Creates backup before operations
- Automatic rollback on failure
- Manual rollback capability
- Timestamped backup naming

### Config File Support

Use configuration files for consistent setups:

```bash
rest-base-create-enhanced --config=./config.json
```

**Example config.json:**

```json
{
  "template": "microservice",
  "skipDeps": false,
  "interactive": false,
  "backup": true,
  "author": "Your Name",
  "license": "MIT"
}
```

## CLI Options Reference

### Global Options

| Option            | Description                          | Example                 |
| ----------------- | ------------------------------------ | ----------------------- |
| `--dry-run`       | Preview operations without execution | `--dry-run`             |
| `--interactive`   | Enable interactive mode              | `--interactive`         |
| `--verbose`       | Enable verbose logging               | `--verbose`             |
| `--config=<file>` | Load configuration from file         | `--config=./setup.json` |
| `--help`          | Show help information                | `--help`                |

### Project Creation Options

| Option              | Description             | Example                   |
| ------------------- | ----------------------- | ------------------------- |
| `--template=<name>` | Use specific template   | `--template=microservice` |
| `--skip-git`        | Skip Git initialization | `--skip-git`              |
| `--skip-install`    | Skip npm install        | `--skip-install`          |

### Standards Setup Options

| Option          | Description                  | Example         |
| --------------- | ---------------------------- | --------------- |
| `--skip-docs`   | Skip documentation copy      | `--skip-docs`   |
| `--skip-config` | Skip configuration files     | `--skip-config` |
| `--skip-deps`   | Skip dependency installation | `--skip-deps`   |
| `--backup`      | Create backup before setup   | `--backup`      |
| `--force`       | Override existing files      | `--force`       |

## Error Handling

The enhanced CLI provides improved error handling:

- **Validation**: Input validation with clear error messages
- **Rollback**: Automatic rollback on critical failures
- **Recovery**: Suggestions for resolving common issues
- **Logging**: Detailed error logs for troubleshooting

## Examples

### Creating a Microservice Project

```bash
# Interactive setup
rest-base-create-enhanced --interactive

# Direct creation with dry-run preview
rest-base-create-enhanced my-microservice --template=microservice --dry-run

# Create with backup
rest-base-create-enhanced my-microservice --template=microservice --backup
```

### Setting up Standards in Existing Project

```bash
# Interactive setup with backup
rest-base-setup-enhanced --interactive --backup

# Dry-run to preview changes
rest-base-setup-enhanced ./existing-project --dry-run

# Skip dependency installation
rest-base-setup-enhanced --skip-deps --force
```

### Using Configuration Files

Create a `rest-base.config.json`:

```json
{
  "template": "api-gateway",
  "author": "Your Team",
  "license": "MIT",
  "skipGit": false,
  "backup": true,
  "interactive": false
}
```

Then use it:

```bash
rest-base-create-enhanced my-gateway --config=rest-base.config.json
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure write permissions in target directory
2. **Template Not Found**: Check available templates with `--help`
3. **Backup Failures**: Ensure sufficient disk space
4. **Dependency Conflicts**: Use `--skip-deps` and install manually

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
rest-base-create-enhanced my-project --verbose --dry-run
```

This will show detailed operation logs and help identify issues.
