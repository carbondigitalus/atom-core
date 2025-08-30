// NPM Modules
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  coverageDirectory: 'reports/coverage',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['html', 'text'],
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@atomdev/core$': '<rootDir>/src',
    '^@atomdev/core/(.*)$': '<rootDir>/src/$1'
  },
  reporters: [
    'default',
    [
      'jest-allure2-reporter',
      {
        resultsDir: 'reports/jest/data'
      }
    ]
  ],
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts']
};

export default config;
