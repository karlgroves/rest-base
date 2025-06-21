/**
 * Logger utility for CLI tools
 */

const chalk = require("chalk");

class Logger {
  constructor() {
    this.verbose = process.env.VERBOSE === "true";
  }

  info(message, data = null) {
    console.log(chalk.blue("ℹ"), message);
    if (data && this.verbose) {
      console.log(chalk.gray("  Data:"), data);
    }
  }

  success(message, data = null) {
    console.log(chalk.green("✓"), message);
    if (data && this.verbose) {
      console.log(chalk.gray("  Data:"), data);
    }
  }

  warn(message, data = null) {
    console.log(chalk.yellow("⚠"), message);
    if (data && this.verbose) {
      console.log(chalk.gray("  Data:"), data);
    }
  }

  error(message, error = null) {
    console.error(chalk.red("✗"), message);
    if (error) {
      console.error(chalk.red("  Error:"), error.message || error);
      if (error.stack && this.verbose) {
        console.error(chalk.gray(error.stack));
      }
    }
  }

  debug(message, data = null) {
    if (this.verbose) {
      console.log(chalk.gray("●"), message);
      if (data) {
        console.log(chalk.gray("  Data:"), data);
      }
    }
  }
}

module.exports = new Logger();
