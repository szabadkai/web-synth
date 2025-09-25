module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  settings: {
    react: { version: 'detect' }
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  rules: {
    'react/react-in-jsx-scope': 'off'
  }
};
