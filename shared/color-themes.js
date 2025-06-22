/**
 * Color themes for CLI output with high contrast support
 * 
 * @module shared/color-themes
 * @author Karl Groves
 */

const chalk = require('chalk');

/**
 * Standard color theme for normal contrast environments
 */
const standardTheme = {
  info: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  debug: chalk.gray,
  muted: chalk.gray,
  highlight: chalk.cyan,
  label: chalk.blue,
  value: chalk.white,
  heading: chalk.bold.blue,
  subheading: chalk.bold.white,
  reset: chalk.reset
};

/**
 * High contrast color theme for accessibility
 * Uses bold and underline for emphasis instead of just colors
 */
const highContrastTheme = {
  info: chalk.bold.blueBright,
  success: chalk.bold.greenBright,
  warning: chalk.bold.yellowBright,
  error: chalk.bold.redBright,
  debug: chalk.bold.white,
  muted: chalk.bold.gray,
  highlight: chalk.bold.underline.cyanBright,
  label: chalk.bold.underline.blueBright,
  value: chalk.bold.whiteBright,
  heading: chalk.bold.underline.blueBright,
  subheading: chalk.bold.underline.whiteBright,
  reset: chalk.reset
};

/**
 * Monochrome theme for environments without color support
 * Uses text decorations only
 */
const monochromeTheme = {
  info: chalk.bold,
  success: chalk.bold,
  warning: chalk.bold.underline,
  error: chalk.bold.underline,
  debug: chalk.dim,
  muted: chalk.dim,
  highlight: chalk.bold.underline,
  label: chalk.underline,
  value: chalk.bold,
  heading: chalk.bold.underline,
  subheading: chalk.bold,
  reset: chalk.reset
};

/**
 * Detects if high contrast mode should be enabled
 * 
 * @returns {boolean} True if high contrast mode is needed
 */
function shouldUseHighContrast() {
  // Check environment variable first
  if (process.env.HIGH_CONTRAST === 'true' || process.env.HIGH_CONTRAST === '1') {
    return true;
  }
  
  // Check for forced high contrast mode
  if (process.env.FORCE_HIGH_CONTRAST === 'true') {
    return true;
  }
  
  // Check terminal color depth
  const colorDepth = chalk.level;
  if (colorDepth === 0) {
    return true; // No color support, use monochrome
  }
  
  // Check for common high contrast terminal indicators
  const term = process.env.TERM || '';
  const colorterm = process.env.COLORTERM || '';
  
  // Common high contrast terminal types
  const highContrastTerminals = [
    'xterm-mono',
    'linux-m',
    'dumb',
    'cons25-m'
  ];
  
  if (highContrastTerminals.some(t => term.includes(t))) {
    return true;
  }
  
  // Check accessibility preferences on macOS
  if (process.platform === 'darwin' && process.env.ACCESSIBILITY_DISPLAY_SHOULD_INCREASE_CONTRAST === '1') {
    return true;
  }
  
  return false;
}

/**
 * Gets the appropriate color theme based on environment
 * 
 * @returns {Object} Color theme object
 */
function getColorTheme() {
  // Check if colors are completely disabled
  if (process.env.NO_COLOR || !chalk.supportsColor) {
    return monochromeTheme;
  }
  
  // Check for high contrast mode
  if (shouldUseHighContrast()) {
    return highContrastTheme;
  }
  
  // Default to standard theme
  return standardTheme;
}

/**
 * Creates a styled text formatter with current theme
 * 
 * @param {string} style - The style name from the theme
 * @returns {Function} Chalk styling function
 */
function style(styleName) {
  const theme = getColorTheme();
  return theme[styleName] || chalk.reset;
}

/**
 * Formats a label-value pair with appropriate styling
 * 
 * @param {string} label - The label text
 * @param {string} value - The value text
 * @returns {string} Formatted string
 */
function formatLabelValue(label, value) {
  const theme = getColorTheme();
  return `${theme.label(label)}: ${theme.value(value)}`;
}

/**
 * Creates a visual separator line
 * 
 * @param {number} length - Length of the separator
 * @param {string} char - Character to use for separator
 * @returns {string} Formatted separator
 */
function separator(length = 50, char = '-') {
  const theme = getColorTheme();
  return theme.muted(char.repeat(length));
}

/**
 * Gets theme information for debugging
 * 
 * @returns {Object} Theme information
 */
function getThemeInfo() {
  return {
    colorSupport: chalk.supportsColor,
    colorLevel: chalk.level,
    highContrastEnabled: shouldUseHighContrast(),
    currentTheme: shouldUseHighContrast() ? 'high-contrast' : 'standard',
    term: process.env.TERM || 'unknown',
    platform: process.platform,
    env: {
      HIGH_CONTRAST: process.env.HIGH_CONTRAST,
      FORCE_HIGH_CONTRAST: process.env.FORCE_HIGH_CONTRAST,
      NO_COLOR: process.env.NO_COLOR,
      COLORTERM: process.env.COLORTERM
    }
  };
}

module.exports = {
  standardTheme,
  highContrastTheme,
  monochromeTheme,
  shouldUseHighContrast,
  getColorTheme,
  style,
  formatLabelValue,
  separator,
  getThemeInfo
};