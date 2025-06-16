module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  rules: {
    'react/prop-types': 'off', // Disabled since we're using TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }], // Allow unused vars starting with _
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react/jsx-uses-react': 'off', // Not needed with React 17+
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};