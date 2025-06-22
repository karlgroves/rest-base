module.exports = {
  "extends": "airbnb-base",
  "env": {
    "node": true,
    "jest": true
  },
  "rules": {
    "comma-dangle": [
      "error",
      "never"
    ],
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "next"
      }
    ],
    "max-len": [
      "error",
      {
        "code": 100,
        "ignoreComments": true
      }
    ],
    "no-console": [
      "warn"
    ],
    "prefer-const": [
      "error"
    ],
    "no-var": [
      "error"
    ]
  },
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  }
};