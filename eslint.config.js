import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist', 'node_modules', '.astro', 'astro.config.mjs'] },
  js.configs.recommended,
  ...ts.configs.recommended.map((c) => ({
    ...c,
    rules: {
      ...c.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  })),
  ...astro.configs.recommended,
];
