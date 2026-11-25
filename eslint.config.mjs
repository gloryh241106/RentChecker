import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';

const TEST_FILES = ['**/*.test.ts', '**/*.test.tsx'];

const limit = (max) => ['error', { max, skipBlankLines: true, skipComments: true }];

// shared/ has no Node or DOM types. These rules also stop what the type checker allows.
const SHARED_FORBIDDEN_GLOBALS = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'fetch',
  'process',
  'Buffer',
];

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'dist-server/**', 'coverage/**', '.vercel/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
      'max-lines': limit(200),
      'max-lines-per-function': limit(50),
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      complexity: ['error', 10],
    },
  },
  {
    files: ['**/*.tsx', ...TEST_FILES],
    rules: { 'max-lines-per-function': limit(150) },
  },
  {
    files: ['{client,server,shared}/src/**/*.{ts,tsx}'],
    ignores: TEST_FILES,
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  {
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', ...SHARED_FORBIDDEN_GLOBALS],
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'Pass the date in.' },
        { object: 'Math', property: 'random', message: 'shared/ is deterministic.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Pass the date in.',
        },
      ],
    },
  },
  {
    files: ['shared/**/*.ts'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Only relative files and Zod.
              regex: '^(?!\\.|zod$)',
              message: 'shared/ may import only shared files and Zod.',
            },
            {
              group: ['**/client/**', '**/server/**'],
              message: 'shared/ must not import client/ or server/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // client/src/api is the API client and stays allowed.
              group: ['**/server/**', '**/api/index.js'],
              message: 'client/ must not import server/ or the Vercel entry.',
            },
          ],
          paths: ['express', '@google/genai', 'pg'],
        },
      ],
    },
  },
  {
    files: ['client/src/{components,pages}/**/*.{ts,tsx}'],
    ignores: TEST_FILES,
    rules: {
      'no-restricted-globals': ['error', 'fetch', 'localStorage', 'sessionStorage'],
    },
  },
  {
    files: ['server/**/*.ts', 'api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/client/**'], message: 'server/ and api/ must not import client/.' },
          ],
          paths: ['react', 'react-dom'],
        },
      ],
    },
  },
  {
    files: ['server/**/*.ts'],
    ignores: ['server/src/index.ts', ...TEST_FILES],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Only an entry file reads process.env.' },
      ],
    },
  },
  prettierConfig,
);
