# Keyboard Shortcuts and CLI Navigation Guide

> **Navigation:** [Main Documentation](./README.md#documentation-navigation) |
> [⚙️ CLI API Documentation](./CLI-API-DOCUMENTATION.md) |
> [♿ Accessibility](./docs/cli-accessibility-improvements.md)

## Table of Contents

- [Overview](#overview)
- [Terminal Navigation Shortcuts](#terminal-navigation-shortcuts)
  - [Universal Terminal Shortcuts](#universal-terminal-shortcuts)
  - [Platform-Specific Shortcuts](#platform-specific-shortcuts)
- [CLI Tool Shortcuts](#cli-tool-shortcuts)
  - [Interactive Mode Navigation](#interactive-mode-navigation)
  - [Selection and Multi-Select](#selection-and-multi-select)
  - [Text Input](#text-input)
- [Auto-Completion](#auto-completion)
  - [Tab Completion](#tab-completion)
  - [Shell-Specific Completion](#shell-specific-completion)
- [Accessibility Shortcuts](#accessibility-shortcuts)
  - [Screen Reader Support](#screen-reader-support)
  - [High Contrast Mode](#high-contrast-mode)
  - [Accessibility Mode](#accessibility-mode)
- [Command History and Search](#command-history-and-search)
  - [History Navigation](#history-navigation)
  - [Reverse Search](#reverse-search)
- [Quick Command Reference](#quick-command-reference)
- [Tips and Best Practices](#tips-and-best-practices)

## Overview

The REST-SPEC CLI tools are designed to be fully accessible and navigable using only the keyboard.
This guide covers all keyboard shortcuts, navigation patterns, and accessibility features available
in the CLI tools.

## Terminal Navigation Shortcuts

### Universal Terminal Shortcuts

These shortcuts work across most terminal emulators:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Tab` | Auto-complete | Complete commands, file paths, and options |
| `↑` / `↓` | History navigation | Navigate through command history |
| `Ctrl+A` | Beginning of line | Move cursor to start of line |
| `Ctrl+E` | End of line | Move cursor to end of line |
| `Ctrl+U` | Clear line before cursor | Delete all text before cursor |
| `Ctrl+K` | Clear line after cursor | Delete all text after cursor |
| `Ctrl+W` | Delete word | Delete word before cursor |
| `Ctrl+L` | Clear screen | Clear terminal screen |
| `Ctrl+C` | Cancel command | Interrupt current command |
| `Ctrl+D` | Exit/EOF | Exit terminal or send EOF |
| `Ctrl+R` | Reverse search | Search command history |
| `Ctrl+Z` | Suspend process | Suspend current process |

### Platform-Specific Shortcuts

#### macOS Terminal

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+K` | Clear scrollback | Clear terminal history |
| `Cmd+T` | New tab | Open new terminal tab |
| `Cmd+Left/Right` | Word navigation | Jump between words |
| `Option+Left/Right` | Word navigation | Alternative word jump |
| `Cmd+Shift+[/]` | Tab navigation | Switch between tabs |

#### Windows Terminal

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+T` | New tab | Open new terminal tab |
| `Alt+Left/Right` | Word navigation | Jump between words |
| `Ctrl+Tab` | Next tab | Switch to next tab |
| `Ctrl+Shift+Tab` | Previous tab | Switch to previous tab |
| `Ctrl+Shift+F` | Find | Search in terminal output |

#### Linux Terminal

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+T` | New tab | Open new terminal tab |
| `Ctrl+Left/Right` | Word navigation | Jump between words |
| `Ctrl+PgUp/PgDn` | Tab navigation | Switch between tabs |
| `Shift+PgUp/PgDn` | Scroll | Scroll terminal output |

## CLI Tool Shortcuts

### Interactive Mode Navigation

When using `--interactive` or `-i` mode with REST-SPEC CLI tools:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `↓` | Navigate options | Move through menu items |
| `Space` | Toggle selection | Select/deselect in multi-select |
| `Enter` | Confirm | Accept current selection |
| `Esc` | Cancel | Cancel current prompt |
| `Ctrl+C` | Exit | Exit interactive mode |
| `Tab` | Next field | Move to next input field |
| `Shift+Tab` | Previous field | Move to previous input field |

### Selection and Multi-Select

In multi-select prompts:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Space` | Toggle item | Select/deselect current item |
| `a` | Select all | Select all items |
| `i` | Invert selection | Invert current selection |
| `Enter` | Confirm | Accept selections |

### Text Input

In text input fields:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `←` / `→` | Character navigation | Move cursor left/right |
| `Ctrl+←` / `Ctrl+→` | Word navigation | Jump by word |
| `Home` / `End` | Line navigation | Jump to start/end |
| `Delete` | Delete forward | Delete character after cursor |
| `Backspace` | Delete backward | Delete character before cursor |

## Auto-Completion

### Tab Completion

REST-SPEC CLI tools support intelligent tab completion:

```bash
# Complete command names
create-project [Tab]
setup-standards [Tab]

# Complete options
create-project --[Tab]
# Shows: --dry-run, --interactive, --config, --template, etc.

# Complete template names
create-project my-app --template [Tab]
# Shows: default, microservice, api-gateway, graphql, websocket

# Complete file paths
setup-standards --config [Tab]
# Shows: .json files in current directory
```

### Shell-Specific Completion

Install auto-completion for your shell:

```bash
# Generate completion scripts
node scripts/auto-completion.js generate

# Install for specific shell
node scripts/auto-completion.js install bash
node scripts/auto-completion.js install zsh
node scripts/auto-completion.js install fish
```

## Accessibility Shortcuts

### Screen Reader Support

Enable accessibility mode for optimal screen reader experience:

```bash
# Set environment variable
export A11Y_MODE=1
# or
export ACCESSIBLE_MODE=1

# Run commands with accessibility mode
create-project my-app
```

Screen reader navigation:

| Action | NVDA | JAWS | VoiceOver |
|--------|------|------|-----------|
| Read line | `Insert+↑` | `Insert+↑` | `Ctrl+Opt+L` |
| Read all | `Insert+↓` | `Insert+↓` | `Ctrl+Opt+A` |
| Stop reading | `Ctrl` | `Ctrl` | `Ctrl` |
| Navigate by word | `Ctrl+←/→` | `Ctrl+←/→` | `Opt+←/→` |

### High Contrast Mode

Enable high contrast mode for better visibility:

```bash
# Set color theme
export REST_SPEC_THEME=high-contrast

# Available themes
export REST_SPEC_THEME=default
export REST_SPEC_THEME=high-contrast
export REST_SPEC_THEME=colorblind
export REST_SPEC_THEME=monochrome
```

### Accessibility Mode

When accessibility mode is enabled:

- Progress indicators announce at regular intervals
- All visual elements have text alternatives
- Status messages include descriptive prefixes
- No information is conveyed only through color

## Command History and Search

### History Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` | Previous command | Navigate to previous command |
| `↓` | Next command | Navigate to next command |
| `!!` | Last command | Execute last command |
| `!n` | Command n | Execute command number n |
| `!-n` | n commands ago | Execute n commands ago |
| `!string` | Last matching | Execute last command starting with string |

### Reverse Search

1. Press `Ctrl+R` to start reverse search
2. Type to search through history
3. Press `Ctrl+R` again to find next match
4. Press `Enter` to execute found command
5. Press `Ctrl+G` or `Esc` to cancel search

## Quick Command Reference

### Create Project

```bash
# Basic usage
create-project my-app [Enter]

# With options (use Tab for completion)
create-project my-app --template [Tab] microservice [Enter]

# Interactive mode
create-project --interactive [Enter]
# Use ↑/↓ to navigate, Space to select, Enter to confirm

# Dry run mode
create-project my-app --dry-run [Enter]
```

### Setup Standards

```bash
# Current directory
setup-standards [Enter]

# Specific directory
setup-standards /path/to/project [Tab] [Enter]

# With rollback
setup-standards --rollback [Enter]
# Use ↑/↓ to select backup, Enter to confirm
```

### Navigation Examples

```bash
# Quick navigation to project
cd my-app [Tab] [Enter]

# Install dependencies
npm install [Enter]

# Run development server
npm run dev [Enter]
```

## Tips and Best Practices

### 1. Use Tab Completion Liberally

Tab completion saves time and prevents typos:

```bash
# Instead of typing full paths
create-project my-awesome-rest-api-project

# Use tab to complete
create-pr[Tab] my-awe[Tab]
```

### 2. Leverage History

Use history shortcuts for repeated commands:

```bash
# Run last create-project command
!create

# Run last npm command
!npm
```

### 3. Create Aliases

Add to your shell configuration:

```bash
# ~/.bashrc or ~/.zshrc
alias cproj='create-project'
alias setup='setup-standards'
alias nrd='npm run dev'
alias nrt='npm run test'
```

### 4. Use Interactive Mode for Complex Operations

When unsure about options:

```bash
create-project --interactive
# Guides you through all options with keyboard navigation
```

### 5. Enable Accessibility Features

For screen reader users or visual impairments:

```bash
# In ~/.bashrc or ~/.zshrc
export A11Y_MODE=1
export REST_SPEC_THEME=high-contrast
```

### 6. Master Movement Shortcuts

Efficient line editing saves time:

- `Ctrl+A` then type to prepend
- `Ctrl+E` then type to append
- `Ctrl+W` to quickly delete mistakes
- `Alt+B/F` or `Ctrl+←/→` to jump words

### 7. Use Dry Run for Learning

Explore what commands do without making changes:

```bash
create-project test-app --dry-run --verbose
# See all operations that would be performed
```

### 8. Combine Shortcuts

Chain shortcuts for efficiency:

```bash
# Clear line and type new command
Ctrl+U create-project my-app

# Search history and modify
Ctrl+R create → Ctrl+E --dry-run
```

---

For more information about CLI tools, see the [CLI API Documentation](./CLI-API-DOCUMENTATION.md).
For accessibility features, see the [Accessibility Improvements](./docs/cli-accessibility-improvements.md)
guide.
