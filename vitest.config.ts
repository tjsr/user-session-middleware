import { defineConfig } from 'vitest/config';
import { findPackageJson } from '@tjsr/testutils';
import path from 'path';

// import { findPackageJson } from '@tjsr/testutils';

const packageJsonFile = findPackageJson(__dirname);
const projectPath = path.dirname(packageJsonFile);
const setupFilesPath = path.resolve(projectPath, 'src/setup-tests.ts');

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      USERID_UUID_NAMESPACE: '00000000-0000-0000-0000-000000000000',
    },
    globals: true,
    setupFiles: [setupFilesPath],
    testTimeout: (process.env['VITEST_VSCODE'] !== undefined ? 120 : 3) * 1000,
  },
});
