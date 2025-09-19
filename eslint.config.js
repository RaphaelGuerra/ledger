// ESLint flat config for ESLint v9+
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintConfigPrettier from 'eslint-config-prettier'
import * as espree from 'espree'

export default [
  // Ignore build artifacts and vendor dirs
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  // JS/JSX rules
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parser: espree,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // React Hooks recommended rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Turn off formatting-related rules that conflict with Prettier
  eslintConfigPrettier,
]
