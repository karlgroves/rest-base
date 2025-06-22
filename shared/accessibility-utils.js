/**
 * Accessibility Utilities for CLI
 *
 * Provides screen reader friendly output utilities for REST-SPEC CLI tools
 * @author Karl Groves
 */

const readline = require("readline");

class AccessibleProgress {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 0;
    this.lastMessage = "";
  }

  /**
   * Start a new progress indicator
   * @param {string} taskName - Name of the task
   * @param {number} totalSteps - Total number of steps
   */
  start(taskName, totalSteps) {
    this.currentStep = 0;
    this.totalSteps = totalSteps;
    console.log(`Starting: ${taskName} (${totalSteps} steps)`);
  }

  /**
   * Update progress with a message
   * @param {string} message - Progress message
   */
  update(message) {
    this.currentStep++;
    // Clear previous line only if we're updating in place
    if (process.stdout.isTTY && !this.isScreenReaderActive()) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
    }
    
    const progressText = `Step ${this.currentStep} of ${this.totalSteps}: ${message}`;
    console.log(progressText);
    this.lastMessage = message;
  }

  /**
   * Complete the progress indicator
   * @param {string} message - Completion message
   */
  complete(message = "Task completed") {
    console.log(`Success: ${message}`);
  }

  /**
   * Check if a screen reader might be active
   * This is a heuristic check based on environment variables
   */
  isScreenReaderActive() {
    // Check common screen reader environment variables
    return (
      process.env.SCREEN_READER === "1" ||
      process.env.NVDA_RUNNING === "1" ||
      process.env.JAWS_RUNNING === "1" ||
      process.env.VOICEOVER_RUNNING === "1" ||
      // Check for accessibility mode flag
      process.env.A11Y_MODE === "1" ||
      process.env.ACCESSIBLE_MODE === "1"
    );
  }
}

/**
 * Format a list for screen reader friendly output
 * @param {string} title - List title
 * @param {string[]} items - List items
 * @param {boolean} numbered - Whether to number the items
 */
function formatAccessibleList(title, items, numbered = false) {
  let output = `${title} (${items.length} items):\n`;
  
  items.forEach((item, index) => {
    if (numbered) {
      output += `  ${index + 1}. ${item}\n`;
    } else {
      output += `  - ${item}\n`;
    }
  });
  
  return output;
}

/**
 * Format a table for screen reader friendly output
 * @param {string} title - Table title
 * @param {Object[]} rows - Array of row objects
 * @param {string[]} columns - Column names to display
 */
function formatAccessibleTable(title, rows, columns) {
  let output = `${title} (${rows.length} rows):\n\n`;
  
  rows.forEach((row, index) => {
    output += `Row ${index + 1}:\n`;
    columns.forEach(col => {
      output += `  ${col}: ${row[col] || 'N/A'}\n`;
    });
    output += '\n';
  });
  
  return output;
}

/**
 * Format status message with appropriate prefix
 * @param {string} type - Message type (success, error, warning, info)
 * @param {string} message - The message
 */
function formatStatusMessage(type, message) {
  const prefixes = {
    success: "Success:",
    error: "Error:",
    warning: "Warning:",
    info: "Information:",
    debug: "Debug:"
  };
  
  return `${prefixes[type] || ''} ${message}`.trim();
}

/**
 * Create an accessible spinner that announces progress
 * @param {string} message - Spinner message
 */
class AccessibleSpinner {
  constructor(message) {
    this.message = message;
    this.isSpinning = false;
    this.announceInterval = null;
    this.startTime = null;
  }

  start() {
    this.isSpinning = true;
    this.startTime = Date.now();
    console.log(`Processing: ${this.message}`);
    
    // Announce progress every 5 seconds for screen readers
    this.announceInterval = setInterval(() => {
      if (this.isSpinning) {
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        console.log(`Still processing: ${this.message} (${elapsed} seconds elapsed)`);
      }
    }, 5000);
  }

  stop(success = true) {
    this.isSpinning = false;
    if (this.announceInterval) {
      clearInterval(this.announceInterval);
    }
    
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    const status = success ? 'completed successfully' : 'failed';
    console.log(`${formatStatusMessage(success ? 'success' : 'error', `${this.message} ${status} (${elapsed} seconds)`)}}`);
  }
}

module.exports = {
  AccessibleProgress,
  AccessibleSpinner,
  formatAccessibleList,
  formatAccessibleTable,
  formatStatusMessage
};