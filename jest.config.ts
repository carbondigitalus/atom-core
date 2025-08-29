// NPM Modules
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  reporters: [
    'default',
    [
      'jest-allure2-reporter',
      {
        resultsDir: 'reports/jest/data'
      }
    ]
  ]
};

export default config;
