// NPM Modules
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'] },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // 👇 Let the parser choose the nearest tsconfig for each file
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module'
      },
      globals: { node: true, jest: true }
    },
    plugins: { '@typescript-eslint': typescriptEslint, prettier },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-requiring-type-checking'].rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { node: true, jest: true }
    },
    plugins: { prettier },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
];
