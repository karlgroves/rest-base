/**
 * @fileoverview ESLint configuration for API Gateway
 * @module .eslintrc
 */

module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:node/recommended',
    'plugin:security/recommended',
  ],
  plugins: [
    'node',
    'security',
    'import',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Spacing and formatting
    'indent': ['error', 2],
    'max-len': ['error', { 
      code: 100, 
      ignoreUrls: true, 
      ignoreStrings: true, 
      ignoreTemplateLiterals: true 
    }],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // Variables and functions
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console for server applications
    'no-process-exit': 'off', // Allow process.exit in server apps
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',

    // Import rules
    'import/extensions': ['error', 'ignorePackages'],
    'import/no-unresolved': 'off', // Node.js resolution is different
    'import/prefer-default-export': 'off',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
      'newlines-between': 'never',
    }],

    // Node.js specific
    'node/no-missing-import': 'off', // Handled by import/no-unresolved
    'node/no-unsupported-features/es-syntax': 'off', // We use modern ES features
    'node/file-extension-in-import': ['error', 'always'],

    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-require': 'warn',

    // Error handling
    'consistent-return': 'error',
    'no-throw-literal': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'radix': 'error',
    'yoda': 'error',

    // Stylistic
    'camelcase': ['error', { properties: 'never' }],
    'new-cap': 'error',
    'no-nested-ternary': 'error',
    'no-unneeded-ternary': 'error',
    'operator-assignment': 'error',
    'spaced-comment': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.js', '*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'no-unused-expressions': 'off', // Allow chai expect assertions
        'max-len': ['error', { code: 120 }], // Longer lines in tests
      },
    },
  ],
};