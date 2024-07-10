import { findEnvFile, findPackageJson, findViteConfigPath } from '@tjsr/testutils';

import { defineConfig } from 'vitest/config';
import path from 'path';

const packageJsonFile = findPackageJson(__dirname);
const projectPath = path.dirname(packageJsonFile);
const setupFilesPath = path.resolve(projectPath, 'src/setup-tests.ts');
const envFilePath = findEnvFile();

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      DOTENV_FLOW_PATH: envFilePath,
      DOTENV_FLOW_PATTERN: '.env.test',
    },
    globals: true,
    setupFiles: [setupFilesPath],
    testTimeout: (process.env['VITEST_VSCODE'] !== undefined ? 120 : 3) * 1000,
  },
});
