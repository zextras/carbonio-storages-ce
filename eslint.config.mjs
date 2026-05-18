import tseslint from 'typescript-eslint';

export default tseslint.config(
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: 'Type$' }],
      'eqeqeq': 'error',
    },
  },
);
