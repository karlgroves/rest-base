# High Contrast Terminal Theme Support

This document describes the high contrast terminal theme support implemented in the REST-SPEC CLI tools.

## Overview

The REST-SPEC CLI tools now include comprehensive support for high contrast terminal themes and
accessibility features. This ensures that all CLI output remains readable and accessible in various
terminal environments.

## Features

### Automatic Detection

The CLI automatically detects when high contrast mode should be enabled based on:

1. **Environment Variables**
   - `HIGH_CONTRAST=true` - Enables high contrast mode
   - `FORCE_HIGH_CONTRAST=true` - Forces high contrast mode regardless of other settings
   - `NO_COLOR=1` - Disables all colors (monochrome mode)

2. **Terminal Type Detection**
   - Automatically detects terminal types that typically use high contrast
   - Checks for monochrome terminals (xterm-mono, linux-m, dumb, etc.)

3. **Platform-Specific Detection**
   - On macOS: Checks `ACCESSIBILITY_DISPLAY_SHOULD_INCREASE_CONTRAST`
   - Respects system accessibility settings

### Color Themes

Three color themes are available:

1. **Standard Theme** - Default colors for normal terminals
2. **High Contrast Theme** - Bold, bright colors with enhanced visibility
3. **Monochrome Theme** - No colors, uses text decorations only

### Enhanced Visual Elements

In high contrast mode:

- Text is displayed in bold for better visibility
- Important elements use underline for emphasis
- Status indicators use both color and text symbols
- Progress bars use ASCII characters for compatibility

## Usage

### Enabling High Contrast Mode

```bash
# Using environment variable
HIGH_CONTRAST=true rest-spec-create my-project

# Force high contrast mode
FORCE_HIGH_CONTRAST=true rest-spec-update check

# Disable all colors
NO_COLOR=1 rest-spec-setup
```

### Testing High Contrast Mode

A test script is provided to verify high contrast functionality:

```bash
# Test with current settings
node scripts/test-high-contrast.js

# Compare all themes
node scripts/test-high-contrast.js compare

# Force high contrast mode
node scripts/test-high-contrast.js high-contrast

# Force no color mode
node scripts/test-high-contrast.js no-color
```

### Checking Theme Information

The update manager includes a hidden command to display theme information:

```bash
rest-spec-update theme
```

This shows:

- Current color support level
- Active theme
- Environment variables
- Terminal information

## Implementation Details

### Logger Module (`shared/logger.js`)

The logger has been enhanced with:

- Theme-aware color output
- Additional methods for styled output
- Dynamic theme refresh capability

New methods:

- `heading()` - Display section headings
- `subheading()` - Display subsection headings
- `labelValue()` - Format label-value pairs
- `highlight()` - Highlight important text
- `muted()` - Display secondary/muted text
- `refreshTheme()` - Refresh color theme

### Color Themes Module (`shared/color-themes.js`)

Provides:

- Theme definitions (standard, high contrast, monochrome)
- Automatic theme detection
- Helper functions for styled output
- Theme information for debugging

### CLI Utilities Module (`shared/cli-utils.js`)

Offers high-level formatting functions:

- `createSpinner()` - Theme-aware loading spinners
- `formatSection()` - Section headers with underlines
- `formatStatus()` - Status indicators with icons
- `formatProgress()` - Accessible progress bars
- `createBox()` - Bordered content boxes
- `formatListItem()` - Styled list items

## Accessibility Best Practices

1. **Always provide text alternatives** - Don't rely solely on color
2. **Use semantic formatting** - Headers, lists, and status indicators
3. **Test in multiple environments** - Different terminals and color schemes
4. **Respect user preferences** - Honor NO_COLOR and system settings
5. **Provide fallbacks** - ASCII alternatives for special characters

## Examples

### Standard Output

```
[INFO] Creating new project: my-app
[SUCCESS] Project structure created
[ERROR] Failed to initialize Git repository
```

### High Contrast Output

```
[INFO] Creating new project: my-app    (bold, bright blue)
[SUCCESS] Project structure created     (bold, bright green)
[ERROR] Failed to initialize Git        (bold, bright red)
```

### No Color Output

```
[INFO] Creating new project: my-app     (bold)
[OK] Project structure created          (bold)
[ERROR] Failed to initialize Git        (bold, underline)
```

## Compatibility

The high contrast support is compatible with:

- All major terminal emulators
- Screen readers
- SSH sessions
- CI/CD environments
- Docker containers
- Windows Terminal, iTerm2, Terminal.app, etc.

## Future Enhancements

Potential improvements:

- User-configurable color themes
- Persistent theme preferences
- Additional accessibility features
- Integration with system dark/light mode
- Custom color palette support
