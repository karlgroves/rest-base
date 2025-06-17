/**
 * Integration tests for setup-standards.js workflow
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

describe('Setup Standards Integration', () => {
  let tempDir;
  let scriptsDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rest-spec-setup-test-'));
    scriptsDir = path.join(__dirname, '..', '..', 'scripts');
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Setup Standards Workflow', () => {
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

    it('should setup standards in an existing project', (done) => {
      const setupScript = path.join(scriptsDir, 'setup-standards.js');
      
      const child = spawn('node', [setupScript, tempDir], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          if (code !== 0) {
            console.error('STDOUT:', stdout);
            console.error('STDERR:', stderr);
          }
          // Should exit successfully
          expect(code).toBe(0);
          
          // Check that directories were created
          expect(fs.existsSync(path.join(tempDir, 'docs'))).toBe(true);
          expect(fs.existsSync(path.join(tempDir, 'docs', 'standards'))).toBe(true);
          
          // Check that standards files were copied
          expect(fs.existsSync(path.join(tempDir, 'docs', 'standards', 'CLAUDE.md'))).toBe(true);
          expect(fs.existsSync(path.join(tempDir, 'docs', 'standards', 'global-rules.md'))).toBe(true);
          
          // Check that config files were created
          expect(fs.existsSync(path.join(tempDir, '.eslintrc.js'))).toBe(true);
          
          // Check that package.json was updated
          const updatedPackageJson = JSON.parse(
            fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')
          );
          expect(updatedPackageJson.scripts).toBeDefined();
          expect(updatedPackageJson.scripts.lint).toBeDefined();
          expect(updatedPackageJson.scripts['lint:js']).toBeDefined();
          expect(updatedPackageJson.scripts['lint:md']).toBeDefined();
          
          // Check progress output
          expect(stdout).toContain('REST-Base Standards Setup');
          expect(stdout).toContain('Step 1/5');
          expect(stdout).toContain('Setup complete');
          
          done();
        } catch (error) {
          done(error);
        }
      });

      child.on('error', (error) => {
        done(new Error(`Failed to spawn process: ${error.message}`));
      });
    }, 15000);

    it('should handle missing package.json gracefully', (done) => {
      // Remove package.json
      fs.unlinkSync(path.join(tempDir, 'package.json'));
      
      const setupScript = path.join(scriptsDir, 'setup-standards.js');
      
      const child = spawn('node', [setupScript, tempDir], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Should still create directories and files but show package.json error
          expect(fs.existsSync(path.join(tempDir, 'docs'))).toBe(true);
          expect(fs.existsSync(path.join(tempDir, '.eslintrc.js'))).toBe(true);
          
          // Should show package.json warning
          expect(stdout).toContain('No package.json found');
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 15000);

    it('should validate configuration files content', (done) => {
      const setupScript = path.join(scriptsDir, 'setup-standards.js');
      
      const child = spawn('node', [setupScript, tempDir], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          
          // Validate ESLint configuration
          const eslintConfig = fs.readFileSync(path.join(tempDir, '.eslintrc.js'), 'utf8');
          expect(eslintConfig).toContain('airbnb-base');
          expect(eslintConfig).toContain('comma-dangle');
          expect(eslintConfig).toContain('no-unused-vars');
          
          // Validate that standards files have content
          const claudeFile = fs.readFileSync(
            path.join(tempDir, 'docs', 'standards', 'CLAUDE.md'), 
            'utf8'
          );
          expect(claudeFile.length).toBeGreaterThan(0);
          expect(claudeFile).toContain('CLAUDE.md');
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 15000);
  });

  describe('Error Handling and Rollback', () => {
    it('should handle permission errors gracefully', (done) => {
      // Create a read-only directory to simulate permission errors
      const readOnlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readOnlyDir);
      
      // Create package.json in read-only directory
      const packageJson = { name: 'test-project', version: '1.0.0' };
      fs.writeFileSync(
        path.join(readOnlyDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Make directory read-only (on Unix-like systems)
      if (process.platform !== 'win32') {
        fs.chmodSync(readOnlyDir, 0o444);
      }
      
      const setupScript = path.join(scriptsDir, 'setup-standards.js');
      
      const child = spawn('node', [setupScript, readOnlyDir], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Should handle permission errors gracefully
          if (process.platform !== 'win32') {
            // On Unix-like systems, should show permission error
            expect(code).not.toBe(0);
          }
          
          // Restore permissions for cleanup
          if (process.platform !== 'win32') {
            fs.chmodSync(readOnlyDir, 0o755);
          }
          
          done();
        } catch (error) {
          // Restore permissions for cleanup
          if (process.platform !== 'win32') {
            fs.chmodSync(readOnlyDir, 0o755);
          }
          done(error);
        }
      });
    }, 15000);
  });

  describe('Configuration Integration', () => {
    it('should use custom configuration if available', (done) => {
      // Create a custom configuration
      const customConfig = {
        configFiles: ['.gitignore'], // Only gitignore, no markdownlint
        standardsFiles: ['CLAUDE.md'] // Only CLAUDE.md
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'rest-spec.config.js'),
        `module.exports = ${JSON.stringify(customConfig, null, 2)};`
      );
      
      // Create package.json
      const packageJson = { name: 'test-project', version: '1.0.0' };
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      const setupScript = path.join(scriptsDir, 'setup-standards.js');
      
      const child = spawn('node', [setupScript, tempDir], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          
          // Should only have created CLAUDE.md (not other standards files)
          expect(fs.existsSync(path.join(tempDir, 'docs', 'standards', 'CLAUDE.md'))).toBe(true);
          
          // Should have copied .gitignore but maybe not .markdownlint.json depending on config
          expect(fs.existsSync(path.join(tempDir, '.gitignore'))).toBe(true);
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 15000);
  });
});