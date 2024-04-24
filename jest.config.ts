import type { JestConfigWithTsJest } from 'ts-jest';
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config({silent: true});

const config: JestConfigWithTsJest = {
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.[m]ts',
  ],
  coverageDirectory: 'coverage',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts'],
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/test/mocks/styleMock.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^\.+\\.env.*$': '$1',
  },
  modulePathIgnorePatterns: ['amplify', 'dist', 'build', 'node_modules'],
  setupFiles: ['<rootDir>/src/setup-tests.ts'],
  silent: false,
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  verbose: true,
};

export default config;
