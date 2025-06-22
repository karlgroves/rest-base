/**
 * Update Checker Utility
 *
 * Checks for available updates to REST-SPEC and notifies users
 * @author Karl Groves
 */

const fs = require("fs").promises;
const path = require("path");
const https = require("https");

class UpdateChecker {
  constructor() {
    this.packagePath = path.join(__dirname, "..", "package.json");
    this.cacheFile = path.join(__dirname, "..", ".update-cache.json");
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get the current version from package.json
   */
  async getCurrentVersion() {
    try {
      const packageContent = await fs.readFile(this.packagePath, "utf8");
      const packageJson = JSON.parse(packageContent);
      return packageJson.version;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch the latest version from npm registry
   */
  async getLatestVersion() {
    return new Promise((resolve) => {
      const options = {
        hostname: "registry.npmjs.org",
        path: "/rest-spec/latest",
        method: "GET",
        headers: {
          "User-Agent": "REST-SPEC-CLI",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            if (res.statusCode === 200) {
              const packageInfo = JSON.parse(data);
              resolve(packageInfo.version);
            } else {
              resolve(null);
            }
          } catch (error) {
            resolve(null);
          }
        });
      });

      req.on("error", () => {
        resolve(null);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }

  /**
   * Compare two semantic versions
   */
  compareVersions(current, latest) {
    if (!current || !latest) return false;

    const currentParts = current.split(".").map((num) => parseInt(num, 10));
    const latestParts = latest.split(".").map((num) => parseInt(num, 10));

    for (
      let i = 0;
      i < Math.max(currentParts.length, latestParts.length);
      i++
    ) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) {
        return true; // Update available
      } else if (latestPart < currentPart) {
        return false; // Current is newer
      }
    }

    return false; // Versions are equal
  }

  /**
   * Check if we should check for updates (respects cache interval)
   */
  async shouldCheckForUpdates() {
    try {
      const cacheContent = await fs.readFile(this.cacheFile, "utf8");
      const cache = JSON.parse(cacheContent);
      const now = Date.now();

      return now - cache.lastCheck > this.checkInterval;
    } catch (error) {
      return true; // No cache file or error reading it
    }
  }

  /**
   * Update the cache with the last check time
   */
  async updateCache(latestVersion) {
    const cache = {
      lastCheck: Date.now(),
      latestVersion: latestVersion,
    };

    try {
      await fs.writeFile(this.cacheFile, JSON.stringify(cache, null, 2));
    } catch (error) {
      // Ignore cache write errors
    }
  }

  /**
   * Format the update notification message
   */
  formatUpdateMessage(currentVersion, latestVersion) {
    return [
      "",
      "========================================================",
      "UPDATE AVAILABLE: REST-SPEC",
      "========================================================",
      `Current version: ${currentVersion}`,
      `Latest version: ${latestVersion}`,
      "",
      "To update, run one of the following commands:",
      "  npm install -g rest-spec@latest",
      "  npm update -g rest-spec",
      "",
      "View changelog at:",
      "  https://github.com/karlgroves/rest-spec/releases",
      "========================================================",
      "",
    ].join("\n");
  }

  /**
   * Check for updates and display notification if available
   */
  async checkForUpdates(force = false) {
    try {
      // Check if we should perform the update check
      if (!force && !(await this.shouldCheckForUpdates())) {
        return false;
      }

      const currentVersion = await this.getCurrentVersion();
      if (!currentVersion) {
        return false;
      }

      const latestVersion = await this.getLatestVersion();
      if (!latestVersion) {
        return false;
      }

      // Update cache
      await this.updateCache(latestVersion);

      // Check if update is available
      const updateAvailable = this.compareVersions(
        currentVersion,
        latestVersion,
      );

      if (updateAvailable) {
        console.log(this.formatUpdateMessage(currentVersion, latestVersion));
        return true;
      }

      return false;
    } catch (error) {
      // Silently fail - update checking shouldn't break the CLI
      return false;
    }
  }

  /**
   * Disable update checking by creating a flag file
   */
  async disableUpdateChecking() {
    const disableFile = path.join(__dirname, "..", ".no-update-check");
    try {
      await fs.writeFile(disableFile, "");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if update checking is disabled
   */
  async isUpdateCheckingDisabled() {
    const disableFile = path.join(__dirname, "..", ".no-update-check");
    try {
      await fs.access(disableFile);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = UpdateChecker;
