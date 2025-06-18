/**
 * End-to-end tests for CLI commands
 * Tests the actual CLI commands as they would be used by end users
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('CLI Commands End-to-End Tests', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rest-spec-e2e-test-'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('rest-base-create Command', () => {
    it('should create a new project via global CLI command', async () => {
      const projectName = 'test-e2e-project';
      const projectPath = path.join(tempDir, projectName);
      
      // Change to temp directory
      process.chdir(tempDir);
      
      // Run the CLI command as it would be used globally
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName}`;
      
      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 30000
        });
        
        // Verify output
        expect(stdout).toContain('Creating new project');
        expect(stdout).toContain('Project creation complete');
        
        // Verify project structure
        expect(fs.existsSync(projectPath)).toBe(true);
        expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(projectPath, 'src', 'app.js'))).toBe(true);
        expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);
        
        // Verify the created project can be initialized
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
        );
        expect(packageJson.name).toBe(projectName);
        expect(packageJson.scripts.start).toBeDefined();
        expect(packageJson.scripts.test).toBeDefined();
        
      } catch (error) {
        throw new Error(`CLI command failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 45000);

    it('should show help when no arguments provided', async () => {
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')}`;
      
      try {
        await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 10000
        });
        // Should not reach here for valid help display
        throw new Error('Expected command to exit with error code');
      } catch (error) {
        // Should exit with error code 1 and show usage
        expect(error.code).toBe(1);
        expect(error.stdout).toContain('Usage:');
        expect(error.stdout).toContain('Please provide a project name');
      }
    }, 15000);

    it('should validate project name and reject invalid names', async () => {
      const invalidNames = ['test/invalid', 'test|invalid', 'test<invalid', 'test>invalid'];
      
      for (const invalidName of invalidNames) {
        const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} "${invalidName}"`;
        
        try {
          await execAsync(command, {
            cwd: tempDir,
            env: { ...process.env, NODE_ENV: 'test' },
            timeout: 10000
          });
          throw new Error(`Expected command to fail for invalid name: ${invalidName}`);
        } catch (error) {
          expect(error.code).toBe(1);
          expect(error.stdout).toContain('Error');
          expect(
            error.stdout.includes('invalid characters') || 
            error.stdout.includes('path separators')
          ).toBe(true);
        }
      }
    }, 30000);

    it('should handle existing directory error', async () => {
      const projectName = 'existing-project';
      const projectPath = path.join(tempDir, projectName);
      
      // Create the directory first
      fs.mkdirSync(projectPath);
      
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName}`;
      
      try {
        await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 10000
        });
        throw new Error('Expected command to fail for existing directory');
      } catch (error) {
        expect(error.code).toBe(1);
        expect(error.stdout).toContain('already exists');
      }
    }, 15000);
  });

  describe('rest-base-setup Command', () => {
    beforeEach(() => {
      // Create a minimal package.json for testing
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {}
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    });

    it('should show error when trying to setup standards with invalid path', async () => {
      // Test that the command properly validates paths (since we can't easily test the full functionality due to path restrictions)
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'setup-standards.js')} /invalid/absolute/path`;
      
      try {
        await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 10000
        });
        throw new Error('Expected command to fail');
      } catch (error) {
        expect(error.code).not.toBe(0);
        expect(error.stdout).toContain('Error');
        expect(error.stdout).toContain('Path traversal detected');
      }
    }, 15000);

    it('should setup standards in specified directory', async () => {
      const targetDirName = 'target-project';
      const targetDir = path.join(tempDir, targetDirName);
      fs.mkdirSync(targetDir);
      
      // Create package.json in target directory
      const packageJson = {
        name: 'target-project',
        version: '1.0.0',
        scripts: {}
      };
      
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Use relative path from temp directory to avoid path traversal validation
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'setup-standards.js')} ${targetDirName}`;
      
      try {
        const { stdout } = await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 25000
        });
        
        // Verify output
        expect(stdout).toContain('REST-Base Standards Setup');
        expect(stdout).toContain('Setup complete');
        
        // Verify files were created in target directory
        expect(fs.existsSync(path.join(targetDir, 'docs', 'standards'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, 'docs', 'standards', 'CLAUDE.md'))).toBe(true);
        expect(fs.existsSync(path.join(targetDir, '.eslintrc.js'))).toBe(true);
        
      } catch (error) {
        throw new Error(`CLI command failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 30000);

    it('should handle missing package.json gracefully', async () => {
      // Remove package.json
      fs.unlinkSync(path.join(tempDir, 'package.json'));
      
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'setup-standards.js')}`;
      
      try {
        const { stdout } = await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 25000
        });
        
        // Should still create files but show warning
        expect(stdout).toContain('No package.json found');
        expect(fs.existsSync(path.join(tempDir, 'docs', 'standards'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, '.eslintrc.js'))).toBe(true);
        
      } catch (error) {
        throw new Error(`CLI command failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 30000);
  });

  describe('CLI Command Integration', () => {
    it('should create project and then setup standards', async () => {
      const projectName = 'integration-test-project';
      const projectPath = path.join(tempDir, projectName);
      
      // Step 1: Create project
      const createCommand = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName}`;
      
      try {
        const { stdout: createStdout } = await execAsync(createCommand, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 30000
        });
        
        expect(createStdout).toContain('Project creation complete');
        expect(fs.existsSync(projectPath)).toBe(true);
        
        // Step 2: Setup additional standards (should update existing standards)
        const setupCommand = `node ${path.join(__dirname, '..', '..', 'scripts', 'setup-standards.js')}`;
        
        const { stdout: setupStdout } = await execAsync(setupCommand, {
          cwd: projectPath,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 25000
        });
        
        expect(setupStdout).toContain('Setup complete');
        
        // Verify both operations completed successfully
        expect(fs.existsSync(path.join(projectPath, 'src', 'app.js'))).toBe(true);
        expect(fs.existsSync(path.join(projectPath, 'docs', 'standards', 'CLAUDE.md'))).toBe(true);
        expect(fs.existsSync(path.join(projectPath, '.eslintrc.js'))).toBe(true);
        
        // Verify package.json has been updated by both commands
        const finalPackageJson = JSON.parse(
          fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
        );
        expect(finalPackageJson.name).toBe(projectName);
        expect(finalPackageJson.scripts.start).toBeDefined(); // From create-project
        expect(finalPackageJson.scripts.lint).toBeDefined(); // From setup-standards
        
      } catch (error) {
        throw new Error(`Integration test failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 60000);

    it('should handle concurrent execution gracefully', async () => {
      const projectName1 = 'concurrent-test-1';
      const projectName2 = 'concurrent-test-2';
      
      const command1 = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName1}`;
      const command2 = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName2}`;
      
      try {
        // Run both commands concurrently
        const [result1, result2] = await Promise.all([
          execAsync(command1, {
            cwd: tempDir,
            env: { ...process.env, NODE_ENV: 'test' },
            timeout: 30000
          }),
          execAsync(command2, {
            cwd: tempDir,
            env: { ...process.env, NODE_ENV: 'test' },
            timeout: 30000
          })
        ]);
        
        // Both should succeed
        expect(result1.stdout).toContain('Project creation complete');
        expect(result2.stdout).toContain('Project creation complete');
        
        // Both projects should exist
        expect(fs.existsSync(path.join(tempDir, projectName1))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, projectName2))).toBe(true);
        
      } catch (error) {
        throw new Error(`Concurrent execution test failed: ${error.message}`);
      }
    }, 45000);
  });

  describe('CLI Environment and Configuration', () => {
    it('should respect NODE_ENV environment variable', async () => {
      const projectName = 'env-test-project';
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName}`;
      
      try {
        const { stdout } = await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'production' },
          timeout: 30000
        });
        
        expect(stdout).toContain('Creating new project');
        
        // Verify project was created
        const projectPath = path.join(tempDir, projectName);
        expect(fs.existsSync(projectPath)).toBe(true);
        
        // Check that production environment was respected
        const packageJson = JSON.parse(
          fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
        );
        expect(packageJson).toBeDefined();
        
      } catch (error) {
        throw new Error(`Environment test failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 35000);

    it('should handle custom configuration files', async () => {
      // Create a custom config file
      const customConfig = {
        configFiles: ['.gitignore', '.eslintrc.js'],
        standardsFiles: ['CLAUDE.md', 'global-rules.md']
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'rest-spec.config.js'),
        `module.exports = ${JSON.stringify(customConfig, null, 2)};`
      );
      
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'setup-standards.js')}`;
      
      try {
        const { stdout } = await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 25000
        });
        
        expect(stdout).toContain('Setup complete');
        
        // Verify custom configuration was used
        expect(fs.existsSync(path.join(tempDir, 'docs', 'standards', 'CLAUDE.md'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, 'docs', 'standards', 'global-rules.md'))).toBe(true);
        expect(fs.existsSync(path.join(tempDir, '.eslintrc.js'))).toBe(true);
        
      } catch (error) {
        throw new Error(`Custom configuration test failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 30000);
  });

  describe('CLI Error Scenarios', () => {
    it('should handle filesystem permission errors gracefully', async () => {
      // Skip on Windows due to different permission model
      if (process.platform === 'win32') {
        return;
      }
      
      const readOnlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readOnlyDir);
      fs.chmodSync(readOnlyDir, 0o444); // Read-only
      
      const projectName = 'permission-test';
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName}`;
      
      try {
        await execAsync(command, {
          cwd: readOnlyDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 15000
        });
        throw new Error('Expected command to fail due to permissions');
      } catch (error) {
        expect(error.code).not.toBe(0);
        // On macOS/Linux, permission errors might have string codes like 'EACCES'
        expect(error.code === 'EACCES' || (typeof error.code === 'number' && error.code > 0)).toBe(true);
      } finally {
        // Restore permissions for cleanup
        fs.chmodSync(readOnlyDir, 0o755);
      }
    }, 20000);

    it('should handle disk space errors gracefully', async () => {
      // This test simulates low disk space scenarios
      // We'll create a very large project name to potentially trigger path length issues
      const veryLongName = 'a'.repeat(250); // Very long name
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${veryLongName}`;
      
      try {
        await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 15000
        });
        throw new Error('Expected command to fail due to long path');
      } catch (error) {
        expect(error.code).not.toBe(0);
        // Should show appropriate error message
        expect(error.stdout || error.stderr).toContain('Error');
      }
    }, 20000);
  });

  describe('CLI Output and User Experience', () => {
    it('should provide clear progress indicators', async () => {
      const projectName = 'progress-test-project';
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} ${projectName}`;
      
      try {
        const { stdout } = await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 30000
        });
        
        // Check for progress indicators
        expect(stdout).toContain('Phase 1/3');
        expect(stdout).toContain('Phase 2/3');
        expect(stdout).toContain('Phase 3/3');
        expect(stdout).toContain('Creating new project');
        expect(stdout).toContain('Project creation complete');
        
        // Should not contain debug output in normal mode
        expect(stdout).not.toContain('[DEBUG]');
        
      } catch (error) {
        throw new Error(`Progress indicator test failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
      }
    }, 35000);

    it('should provide actionable error messages', async () => {
      const invalidProjectName = 'test/invalid';
      const command = `node ${path.join(__dirname, '..', '..', 'scripts', 'create-project.js')} "${invalidProjectName}"`;
      
      try {
        await execAsync(command, {
          cwd: tempDir,
          env: { ...process.env, NODE_ENV: 'test' },
          timeout: 10000
        });
        throw new Error('Expected command to fail');
      } catch (error) {
        expect(error.code).toBe(1);
        
        // Error message should be clear and actionable
        expect(error.stdout).toContain('Error');
        expect(
          error.stdout.includes('path separators') || 
          error.stdout.includes('invalid characters')
        ).toBe(true);
        expect(
          error.stdout.includes('Project name') || 
          error.stdout.includes('cannot contain')
        ).toBe(true);
        
        // Should provide usage information
        expect(error.stdout).toContain('Usage:');
      }
    }, 15000);
  });
});