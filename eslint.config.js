// NPM Modules
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.eslintrc.js']
  },
  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module'
      },
      globals: {
        node: true,
        jest: true
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-requiring-type-checking'].rules,

      // Prettier integration
      ...prettierConfig.rules,
      'prettier/prettier': 'error',

      // Your custom rules
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
      globals: {
        node: true,
        jest: true
      }
    },
    plugins: {
      prettier
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
];
