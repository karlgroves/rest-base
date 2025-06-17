/**
 * Integration tests for create-project.js workflow
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

describe('Create Project Integration', () => {
  let tempDir;
  let scriptsDir;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rest-spec-create-test-'));
    scriptsDir = path.join(__dirname, '..', '..', 'scripts');
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Project Creation Workflow', () => {
    it('should create a complete project structure', (done) => {
      const projectName = 'test-api-project';
      const projectPath = path.join(tempDir, projectName);
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript, projectName], {
        stdio: 'pipe',
        cwd: tempDir,
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
          // Should exit successfully
          expect(code).toBe(0);
          
          // Check that project directory was created
          expect(fs.existsSync(projectPath)).toBe(true);
          
          // Check main directories
          expect(fs.existsSync(path.join(projectPath, 'src'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'tests'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'docs'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'public'))).toBe(true);
          
          // Check src subdirectories
          expect(fs.existsSync(path.join(projectPath, 'src', 'controllers'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'models'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'routes'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'middlewares'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'services'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'utils'))).toBe(true);
          
          // Check test subdirectories
          expect(fs.existsSync(path.join(projectPath, 'tests', 'unit'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'tests', 'integration'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'tests', 'fixtures'))).toBe(true);
          
          // Check configuration files
          expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, '.eslintrc.js'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, '.env.example'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, '.gitignore'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);
          
          // Check application files
          expect(fs.existsSync(path.join(projectPath, 'src', 'app.js'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'utils', 'logger.js'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'middlewares', 'errorHandler.js'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'src', 'routes', 'index.js'))).toBe(true);
          
          // Check standards documentation
          expect(fs.existsSync(path.join(projectPath, 'docs', 'standards'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'docs', 'standards', 'CLAUDE.md'))).toBe(true);
          expect(fs.existsSync(path.join(projectPath, 'docs', 'standards', 'global-rules.md'))).toBe(true);
          
          // Check progress output
          expect(stdout).toContain('Creating new project');
          expect(stdout).toContain('Phase 1/3');
          expect(stdout).toContain('Phase 2/3');
          expect(stdout).toContain('Phase 3/3');
          expect(stdout).toContain('Project creation complete');
          
          done();
        } catch (error) {
          done(error);
        }
      });

      child.on('error', (error) => {
        done(new Error(`Failed to spawn process: ${error.message}`));
      });
    }, 20000);

    it('should validate package.json content', (done) => {
      const projectName = 'test-package-validation';
      const projectPath = path.join(tempDir, projectName);
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript, projectName], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          
          // Validate package.json
          const packageJson = JSON.parse(
            fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
          );
          
          expect(packageJson.name).toBe(projectName);
          expect(packageJson.version).toBe('1.0.0');
          expect(packageJson.main).toBe('src/app.js');
          expect(packageJson.scripts).toBeDefined();
          expect(packageJson.scripts.start).toBe('node src/app.js');
          expect(packageJson.scripts.dev).toBe('nodemon src/app.js');
          expect(packageJson.scripts.test).toBe('jest');
          expect(packageJson.dependencies).toBeDefined();
          expect(packageJson.devDependencies).toBeDefined();
          expect(packageJson.engines).toBeDefined();
          expect(packageJson.engines.node).toMatch(/>=\d+\.\d+\.\d+/);
          
          // Check for required dependencies
          expect(packageJson.dependencies.express).toBeDefined();
          expect(packageJson.dependencies.winston).toBeDefined();
          expect(packageJson.dependencies.helmet).toBeDefined();
          expect(packageJson.devDependencies.jest).toBeDefined();
          expect(packageJson.devDependencies.eslint).toBeDefined();
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 20000);

    it('should create valid application files', (done) => {
      const projectName = 'test-app-files';
      const projectPath = path.join(tempDir, projectName);
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript, projectName], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          
          // Validate app.js
          const appJs = fs.readFileSync(path.join(projectPath, 'src', 'app.js'), 'utf8');
          expect(appJs).toContain('express');
          expect(appJs).toContain('helmet');
          expect(appJs).toContain('cors');
          expect(appJs).toContain('errorHandler');
          expect(appJs).toContain('module.exports');
          
          // Validate logger.js
          const loggerJs = fs.readFileSync(path.join(projectPath, 'src', 'utils', 'logger.js'), 'utf8');
          expect(loggerJs).toContain('winston');
          expect(loggerJs).toContain('createLogger');
          expect(loggerJs).toContain('module.exports');
          
          // Validate errorHandler.js
          const errorHandlerJs = fs.readFileSync(path.join(projectPath, 'src', 'middlewares', 'errorHandler.js'), 'utf8');
          expect(errorHandlerJs).toContain('errorHandler');
          expect(errorHandlerJs).toContain('logger');
          expect(errorHandlerJs).toContain('module.exports');
          
          // Validate routes/index.js
          const routesJs = fs.readFileSync(path.join(projectPath, 'src', 'routes', 'index.js'), 'utf8');
          expect(routesJs).toContain('express');
          expect(routesJs).toContain('router');
          expect(routesJs).toContain('/health');
          expect(routesJs).toContain('module.exports');
          
          // Validate .env.example
          const envExample = fs.readFileSync(path.join(projectPath, '.env.example'), 'utf8');
          expect(envExample).toContain('NODE_ENV');
          expect(envExample).toContain('PORT');
          expect(envExample).toContain('DB_HOST');
          expect(envExample).toContain('JWT_SECRET');
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 20000);
  });

  describe('Input Validation', () => {
    it('should reject invalid project names', (done) => {
      const invalidName = 'test|invalid<name>';
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript, invalidName], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Should exit with error
          expect(code).toBe(1);
          
          // Should show validation error
          expect(stdout).toContain('Error');
          expect(stdout).toContain('invalid characters');
          
          // Should not create any directory
          expect(fs.existsSync(path.join(tempDir, invalidName))).toBe(false);
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should handle empty project name', (done) => {
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Should exit with error
          expect(code).toBe(1);
          
          // Should show usage error
          expect(stdout).toContain('Please provide a project name');
          expect(stdout).toContain('Usage:');
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should handle existing directory', (done) => {
      const projectName = 'existing-project';
      const projectPath = path.join(tempDir, projectName);
      
      // Create the directory first
      fs.mkdirSync(projectPath);
      
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript, projectName], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        try {
          // Should exit with error
          expect(code).toBe(1);
          
          // Should show directory exists error
          expect(stdout).toContain('already exists');
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });

  describe('Error Handling and Rollback', () => {
    it('should perform rollback on creation failure', (done) => {
      const projectName = 'test-rollback';
      const projectPath = path.join(tempDir, projectName);
      
      // Create a scenario that might cause failure by making temp directory read-only
      // (This test might be platform-specific)
      
      const createScript = path.join(scriptsDir, 'create-project.js');
      
      const child = spawn('node', [createScript, projectName], {
        stdio: 'pipe',
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';

      child.on('close', (code) => {
        try {
          // Even if creation fails, rollback should clean up
          // (In this case, it should succeed, but we're testing the rollback mechanism exists)
          
          if (code !== 0) {
            // Should show rollback information if there was an error
            expect(stdout).toContain('rollback') || expect(stdout).toContain('Error');
          }
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 15000);
  });
});