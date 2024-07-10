import { findEnvFile, findPackageJson } from '@tjsr/testutils';
import { defineConfig } from 'vitest/config';
// import { findPackageJson } from '@tjsr/testutils';

import path from 'path';

const packageJsonFile = findPackageJson(__dirname);
const projectPath = path.dirname(packageJsonFile);
const setupFilesPath = path.resolve(projectPath, 'src/setup-tests.ts');

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    globals: true,
    setupFiles: [setupFilesPath],
    testTimeout: (process.env['VITEST_VSCODE'] !== undefined ? 120 : 3) * 1000,
  },
});
