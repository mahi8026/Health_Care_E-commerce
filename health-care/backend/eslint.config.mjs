import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    // src/scripts are standalone CLI maintenance tools whose console output is
    // their interface (mirrors jest coverage exclusions). no-console stays
    // strict for application code.
    ignores: ['node_modules/**', 'coverage/**', 'logs/**', 'src/scripts/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
    },
  },
];