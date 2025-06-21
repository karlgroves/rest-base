/**
 * ESLint Configuration
 *
 * Linting rules for {{projectName}}
 * @author {{author}}
 */

module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Possible Errors
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    // Best Practices
    eqeqeq: ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',

    // Variables
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: true,
        variables: true
      }
    ],

    // Stylistic Issues
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'max-len': [
      'error',
      {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],

    // ES6
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
};
