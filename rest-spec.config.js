/**
 * REST-SPEC Configuration File
 * 
 * This file contains customizable options for REST-SPEC CLI tools.
 * Users can override these defaults by creating a rest-spec.config.js
 * file in their project root or home directory.
 * 
 * @author REST-Base Team
 */

module.exports = {
  // Project creation settings
  project: {
    // Default Node.js version to target
    nodeVersion: '22.11.0',
    
    // Default license for new projects
    license: 'MIT',
    
    // Default author information
    author: {
      name: '',
      email: '',
      url: ''
    },
    
    // Default project keywords
    keywords: ['rest', 'api', 'node', 'express'],
    
    // Git initialization settings
    git: {
      enabled: true,
      initialCommitMessage: 'Initial commit with REST-Base standards'
    }
  },

  // Directory structure configuration
  directories: {
    // Source code directory
    src: 'src',
    
    // Test directory
    tests: 'tests',
    
    // Documentation directory
    docs: 'docs',
    
    // Public assets directory
    public: 'public',
    
    // Custom subdirectories within src/
    srcSubdirs: [
      'config',
      'controllers', 
      'middlewares',
      'models',
      'routes',
      'services',
      'utils'
    ],
    
    // Custom subdirectories within tests/
    testSubdirs: [
      'unit',
      'integration',
      'fixtures'
    ],
    
    // Custom subdirectories within public/
    publicSubdirs: [
      'images',
      'styles', 
      'scripts'
    ]
  },

  // Dependency configuration
  dependencies: {
    // Production dependencies to install
    production: {
      'bcrypt': '^5.1.1',
      'cors': '^2.8.5',
      'dotenv': '^16.3.1',
      'express': '^4.18.2',
      'express-validator': '^7.0.1',
      'helmet': '^7.1.0',
      'joi': '^17.11.0',
      'jsonwebtoken': '^9.0.2',
      'morgan': '^1.10.0',
      'mysql2': '^3.6.5',
      'sequelize': '^6.35.1',
      'bunyan': '^1.8.15'
    },
    
    // Development dependencies to install
    development: {
      'eslint': '^8.55.0',
      'eslint-config-airbnb-base': '^15.0.0',
      'eslint-plugin-import': '^2.29.0',
      'jest': '^29.7.0',
      'markdownlint-cli': '^0.37.0',
      'nodemon': '^3.0.2',
      'supertest': '^6.3.3'
    }
  },

  // Scripts to add to package.json
  scripts: {
    start: 'node src/app.js',
    dev: 'nodemon src/app.js',
    test: 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'lint:md': 'markdownlint "*.md" "docs/*.md"',
    'lint:js': 'eslint --ext .js,.jsx,.ts,.tsx .',
    lint: 'npm run lint:md && npm run lint:js'
  },

  // ESLint configuration options
  eslint: {
    // Base configuration to extend
    extends: 'airbnb-base',
    
    // Environment settings
    env: {
      node: true,
      jest: true
    },
    
    // Custom rules (can be overridden)
    rules: {
      'comma-dangle': ['error', 'never'],
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'max-len': ['error', { code: 100, ignoreComments: true }],
      'no-console': ['warn'],
      'prefer-const': ['error'],
      'no-var': ['error']
    },
    
    // Parser options
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },

  // File templates configuration
  templates: {
    // Environment variables template
    envExample: {
      server: {
        NODE_ENV: 'development',
        PORT: '3000'
      },
      database: {
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_NAME: 'db_name',
        DB_USER: 'db_user',
        DB_PASSWORD: 'db_password'
      },
      auth: {
        JWT_SECRET: 'your_jwt_secret',
        JWT_EXPIRATION: '1h'
      },
      logging: {
        LOG_LEVEL: 'info'
      }
    }
  },

  // CLI behavior settings
  cli: {
    // Progress indicators
    progress: {
      enabled: true,
      style: 'phases' // 'phases', 'steps', or 'simple'
    },
    
    // Color output
    colors: {
      enabled: true,
      theme: 'default' // 'default', 'minimal', or 'high-contrast'
    },
    
    // Confirmation prompts
    prompts: {
      destructiveOperations: true,
      overwriteFiles: true
    },
    
    // Logging level
    logging: {
      level: 'info', // 'debug', 'info', 'warn', 'error'
      verbose: false
    }
  },

  // File size thresholds
  thresholds: {
    // File size threshold for streaming vs regular copy (in bytes)
    streamingThreshold: 1024 * 1024, // 1MB
    
    // Maximum file size warnings
    maxFileSize: 10 * 1024 * 1024, // 10MB
    
    // Maximum project size warnings
    maxProjectSize: 100 * 1024 * 1024 // 100MB
  },

  // Standards files to copy
  standardsFiles: [
    'node_structure_and_naming_conventions.md',
    'sql-standards-and-patterns.md', 
    'technologies.md',
    'operations-and-responses.md',
    'request.md',
    'validation.md',
    'global-rules.md',
    'CLAUDE.md'
  ],

  // Configuration files to copy
  configFiles: [
    '.markdownlint.json',
    '.gitignore'
  ]
};