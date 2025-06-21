/**
 * Unit tests for CLI enhancements
 */

const {
  CLIOptionsManager,
  DryRunManager,
  RollbackManager,
  TemplateManager,
  EnhancedCLI,
} = require("../../scripts/cli-enhancements");
const fs = require("fs").promises;
const path = require("path");

describe("CLI Enhancements", () => {
  describe("CLIOptionsManager", () => {
    let manager;

    beforeEach(() => {
      manager = new CLIOptionsManager();
    });

    test("should parse basic options correctly", () => {
      const args = ["--dry-run", "--verbose", "--template=microservice"];
      const result = manager.parseOptions(args);

      expect(result.options["dry-run"]).toBe(true);
      expect(result.options.verbose).toBe(true);
      expect(result.options.template).toBe("microservice");
      expect(result.args).toEqual([]);
    });

    test("should separate arguments from options", () => {
      const args = ["project-name", "--dry-run", "extra-arg"];
      const result = manager.parseOptions(args);

      expect(result.args).toEqual(["project-name", "extra-arg"]);
      expect(result.options["dry-run"]).toBe(true);
    });

    test("should load config file if specified", async () => {
      const configPath = path.join(__dirname, "../fixtures/test-config.json");
      await fs.writeFile(
        configPath,
        JSON.stringify({
          template: "graphql",
          skipDeps: true,
        }),
      );

      try {
        const config = await manager.loadConfigFile(configPath);
        expect(config.template).toBe("graphql");
        expect(config.skipDeps).toBe(true);
      } finally {
        await fs.unlink(configPath);
      }
    });
  });

  describe("DryRunManager", () => {
    let manager;

    beforeEach(() => {
      manager = new DryRunManager();
    });

    test("should record operations", () => {
      manager.recordOperation("create", "Create directory", { path: "/test" });
      manager.recordOperation("copy", "Copy file");

      const operations = manager.getOperations();
      expect(operations).toHaveLength(2);
      expect(operations[0].type).toBe("create");
      expect(operations[0].description).toBe("Create directory");
      expect(operations[0].details.path).toBe("/test");
    });

    test("should display operations summary", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      manager.recordOperation("create", "Create file");
      manager.recordOperation("copy", "Copy file");
      manager.displaySummary();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("DRY RUN"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("CREATE"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("COPY"));

      consoleSpy.mockRestore();
    });
  });

  describe("TemplateManager", () => {
    let manager;

    beforeEach(() => {
      manager = new TemplateManager();
    });

    test("should list available templates", async () => {
      const templates = await manager.listTemplates();

      expect(templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "microservice" }),
          expect.objectContaining({ name: "api-gateway" }),
          expect.objectContaining({ name: "graphql" }),
          expect.objectContaining({ name: "websocket" }),
        ]),
      );
    });

    test("should get template configuration", async () => {
      const template = await manager.getTemplate("microservice");

      expect(template.name).toBe("microservice");
      expect(template.description).toContain("Microservice");
      expect(template.dependencies).toHaveProperty("amqplib");
    });

    test("should handle non-existent template", async () => {
      await expect(manager.getTemplate("non-existent")).rejects.toThrow();
    });
  });

  describe("RollbackManager", () => {
    let manager;
    let testDir;

    beforeEach(async () => {
      manager = new RollbackManager();
      testDir = path.join(__dirname, "../fixtures/rollback-test");
      await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test("should create backup", async () => {
      const testFile = path.join(testDir, "test.txt");
      await fs.writeFile(testFile, "test content");

      await manager.createBackup(testDir, "test-backup");

      const backups = await manager.listBackups();
      expect(backups).toContain("test-backup");
    });

    test("should restore backup", async () => {
      const testFile = path.join(testDir, "test.txt");
      await fs.writeFile(testFile, "original content");

      await manager.createBackup(testDir, "test-backup");

      // Modify file
      await fs.writeFile(testFile, "modified content");

      // Restore backup
      await manager.restoreBackup(testDir, "test-backup");

      const restored = await fs.readFile(testFile, "utf8");
      expect(restored).toBe("original content");
    });
  });

  describe("EnhancedCLI", () => {
    let cli;

    beforeEach(() => {
      cli = new EnhancedCLI();
    });

    test("should initialize with default settings", () => {
      expect(cli.optionsManager).toBeDefined();
      expect(cli.rollbackManager).toBeDefined();
      expect(cli.templateManager).toBeDefined();
    });

    test("should parse command line arguments", () => {
      const originalArgv = process.argv;
      process.argv = [
        "node",
        "script.js",
        "--dry-run",
        "--interactive",
        "test-project",
      ];

      try {
        const context = cli.parseArguments();
        expect(context.options["dry-run"]).toBe(true);
        expect(context.options.interactive).toBe(true);
        expect(context.args).toContain("test-project");
      } finally {
        process.argv = originalArgv;
      }
    });
  });
});
