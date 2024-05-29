// vitest.config.ts

import { defineConfig } from 'vitest/config';
import fs from 'fs';
import os from 'os';
import path from 'path';

const isWindows = os.platform() === 'win32';

const isBaseDirectory = (p: string) => {
  const parsedPath = path.parse(p);
  return parsedPath.root === parsedPath.dir;
};

const searchUpwardsForFile = (filename: string): string => {
  let currentPath = __dirname;
  while ((!isWindows && currentPath !== '/') ||
    (isWindows && !isBaseDirectory(currentPath))) {
    const envFilePath = path.join(currentPath, filename);
    if (fs.existsSync(envFilePath)) {
      return currentPath;
    }

    currentPath = path.dirname(currentPath);
  }
  return '';
};

const searchUpwardsForEnvFile = (): string => {
  return searchUpwardsForFile('.env.test');
};


const findViteConfigPath = ():string => {
  return searchUpwardsForFile('vite.config.ts');
};

const findPackageJsonPath = ():string => {
  return searchUpwardsForFile('package.json');
};

const _projectPath = path.dirname(findPackageJsonPath());
const _setupFilesPath = findViteConfigPath() + './src/setup-tests.ts';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      DOTENV_FLOW_PATH: searchUpwardsForEnvFile(),
      DOTENV_FLOW_PATTERN: '.env.test',
    },
    globals: true,
    setupFiles: [path.resolve(__dirname, 'src/setup-tests.ts')],
  },
});
