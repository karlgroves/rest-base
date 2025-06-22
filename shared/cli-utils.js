/**
 * CLI utilities with high contrast support
 * 
 * @module shared/cli-utils
 * @author Karl Groves
 */

const ora = require('ora');
const { getColorTheme, style, separator, getThemeInfo } = require('./color-themes');

/**
 * Creates a spinner with theme-aware styling
 * 
 * @param {string} text - Initial spinner text
 * @param {Object} options - Spinner options
 * @returns {Object} Ora spinner instance
 */
function createSpinner(text, options = {}) {
  const theme = getColorTheme();
  const spinnerOptions = {
    text,
    color: 'blue',
    ...options
  };

  // Adjust spinner for high contrast mode
  if (process.env.HIGH_CONTRAST === 'true' || process.env.FORCE_HIGH_CONTRAST === 'true') {
    spinnerOptions.spinner = 'dots12'; // More visible spinner
    spinnerOptions.color = 'white';
  }

  // Use simple spinner for no-color environments
  if (process.env.NO_COLOR) {
    spinnerOptions.spinner = 'line';
  }

  return ora(spinnerOptions);
}

/**
 * Formats a list item with theme-aware styling
 * 
 * @param {string} text - Item text
 * @param {string} prefix - Item prefix (e.g., '•', '-', number)
 * @returns {string} Formatted list item
 */
function formatListItem(text, prefix = '•') {
  const theme = getColorTheme();
  return `  ${theme.highlight(prefix)} ${text}`;
}

/**
 * Creates a formatted section header
 * 
 * @param {string} title - Section title
 * @param {boolean} underline - Whether to add underline
 * @returns {string} Formatted section header
 */
function formatSection(title, underline = true) {
  const theme = getColorTheme();
  let output = '\n' + theme.heading(title) + '\n';
  
  if (underline) {
    output += separator(title.length, '=') + '\n';
  }
  
  return output;
}

/**
 * Formats a table row with consistent spacing
 * 
 * @param {Array} columns - Column values
 * @param {Array} widths - Column widths
 * @returns {string} Formatted table row
 */
function formatTableRow(columns, widths) {
  const theme = getColorTheme();
  return columns.map((col, i) => {
    const width = widths[i] || 20;
    return col.toString().padEnd(width);
  }).join(' ');
}

/**
 * Creates a progress indicator for long-running tasks
 * 
 * @param {string} label - Progress label
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @returns {string} Formatted progress indicator
 */
function formatProgress(label, current, total) {
  const theme = getColorTheme();
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.round((percentage / 100) * barLength);
  
  let bar = '[';
  
  if (process.env.NO_COLOR) {
    // Use ASCII characters for no-color environments
    bar += '='.repeat(filledLength);
    bar += '-'.repeat(barLength - filledLength);
  } else {
    // Use block characters for color environments
    bar += theme.success('█'.repeat(filledLength));
    bar += theme.muted('░'.repeat(barLength - filledLength));
  }
  
  bar += ']';
  
  return `${theme.label(label)} ${bar} ${theme.value(percentage + '%')} (${current}/${total})`;
}

/**
 * Formats a status indicator
 * 
 * @param {string} status - Status type ('success', 'error', 'warning', 'info')
 * @param {string} message - Status message
 * @returns {string} Formatted status
 */
function formatStatus(status, message) {
  const theme = getColorTheme();
  const icons = {
    success: process.env.NO_COLOR ? '[OK]' : '✓',
    error: process.env.NO_COLOR ? '[ERROR]' : '✗',
    warning: process.env.NO_COLOR ? '[WARN]' : '⚠',
    info: process.env.NO_COLOR ? '[INFO]' : 'ℹ'
  };
  
  const styles = {
    success: theme.success,
    error: theme.error,
    warning: theme.warning,
    info: theme.info
  };
  
  const icon = icons[status] || icons.info;
  const style = styles[status] || theme.info;
  
  return `${style(icon)} ${message}`;
}

/**
 * Creates a box around content for emphasis
 * 
 * @param {string} content - Content to box
 * @param {Object} options - Box options
 * @returns {string} Boxed content
 */
function createBox(content, options = {}) {
  const theme = getColorTheme();
  const { padding = 1, borderStyle = 'single' } = options;
  
  const lines = content.split('\n');
  const maxLength = Math.max(...lines.map(l => l.length));
  const paddedWidth = maxLength + (padding * 2);
  
  const borders = {
    single: {
      top: '─',
      bottom: '─',
      left: '│',
      right: '│',
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘'
    },
    double: {
      top: '═',
      bottom: '═',
      left: '║',
      right: '║',
      topLeft: '╔',
      topRight: '╗',
      bottomLeft: '╚',
      bottomRight: '╝'
    },
    ascii: {
      top: '-',
      bottom: '-',
      left: '|',
      right: '|',
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+'
    }
  };
  
  // Use ASCII borders for no-color environments
  const border = process.env.NO_COLOR ? borders.ascii : (borders[borderStyle] || borders.single);
  
  let box = '';
  
  // Top border
  box += theme.muted(border.topLeft + border.top.repeat(paddedWidth) + border.topRight) + '\n';
  
  // Content with padding
  lines.forEach(line => {
    const paddedLine = line.padEnd(maxLength);
    box += theme.muted(border.left) + ' '.repeat(padding) + paddedLine + ' '.repeat(padding) + theme.muted(border.right) + '\n';
  });
  
  // Bottom border
  box += theme.muted(border.bottomLeft + border.bottom.repeat(paddedWidth) + border.bottomRight);
  
  return box;
}

/**
 * Prints theme information for debugging
 */
function printThemeInfo() {
  const info = getThemeInfo();
  const theme = getColorTheme();
  
  console.log(theme.heading('Color Theme Information'));
  console.log(separator(30));
  console.log(formatStatus('info', `Color Support: ${info.colorSupport ? 'Yes' : 'No'}`));
  console.log(formatStatus('info', `Color Level: ${info.colorLevel}`));
  console.log(formatStatus('info', `High Contrast: ${info.highContrastEnabled ? 'Enabled' : 'Disabled'}`));
  console.log(formatStatus('info', `Current Theme: ${info.currentTheme}`));
  console.log(formatStatus('info', `Terminal: ${info.term}`));
  console.log(formatStatus('info', `Platform: ${info.platform}`));
  
  console.log('\n' + theme.heading('Environment Variables'));
  console.log(separator(30));
  Object.entries(info.env).forEach(([key, value]) => {
    if (value) {
      console.log(formatStatus('info', `${key}: ${value}`));
    }
  });
}

module.exports = {
  createSpinner,
  formatListItem,
  formatSection,
  formatTableRow,
  formatProgress,
  formatStatus,
  createBox,
  printThemeInfo,
  // Re-export commonly used functions from color-themes
  style,
  separator,
  getThemeInfo
};