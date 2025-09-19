// ESLint flat config for ESLint v9+
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // Ignore build artifacts and vendor dirs
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  // JS/JSX rules
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
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

