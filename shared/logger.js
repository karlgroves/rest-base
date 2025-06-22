/**
 * Logger utility for CLI tools with high contrast support
 * 
 * @module shared/logger
 * @author Karl Groves
 */

const { getColorTheme, formatLabelValue } = require('./color-themes');

class Logger {
  constructor() {
    this.verbose = process.env.VERBOSE === "true";
    this.theme = getColorTheme();
  }

  /**
   * Refreshes the color theme (useful if environment changes)
   */
  refreshTheme() {
    this.theme = getColorTheme();
  }

  info(message, data = null) {
    console.log(this.theme.info("[INFO]"), message);
    if (data && this.verbose) {
      console.log(this.theme.muted("  Data:"), data);
    }
  }

  success(message, data = null) {
    console.log(this.theme.success("[SUCCESS]"), message);
    if (data && this.verbose) {
      console.log(this.theme.muted("  Data:"), data);
    }
  }

  warn(message, data = null) {
    console.log(this.theme.warning("[WARNING]"), message);
    if (data && this.verbose) {
      console.log(this.theme.muted("  Data:"), data);
    }
  }

  error(message, error = null) {
    console.error(this.theme.error("[ERROR]"), message);
    if (error) {
      console.error(this.theme.error("  Error:"), error.message || error);
      if (error.stack && this.verbose) {
        console.error(this.theme.muted(error.stack));
      }
    }
  }

  debug(message, data = null) {
    if (this.verbose) {
      console.log(this.theme.debug("[DEBUG]"), message);
      if (data) {
        console.log(this.theme.debug("  Data:"), data);
      }
    }
  }

  /**
   * Logs a heading with appropriate styling
   * 
   * @param {string} text - Heading text
   */
  heading(text) {
    console.log(this.theme.heading(text));
  }

  /**
   * Logs a subheading with appropriate styling
   * 
   * @param {string} text - Subheading text
   */
  subheading(text) {
    console.log(this.theme.subheading(text));
  }

  /**
   * Logs a label-value pair with appropriate styling
   * 
   * @param {string} label - Label text
   * @param {string} value - Value text
   */
  labelValue(label, value) {
    console.log(formatLabelValue(label, value));
  }

  /**
   * Logs a highlighted message
   * 
   * @param {string} message - Message to highlight
   */
  highlight(message) {
    console.log(this.theme.highlight(message));
  }

  /**
   * Logs a muted/secondary message
   * 
   * @param {string} message - Message to display muted
   */
  muted(message) {
    console.log(this.theme.muted(message));
  }
}

module.exports = new Logger();
