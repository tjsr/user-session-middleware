// vitest.config.ts

import { defineConfig } from 'vitest/config'
import fs from 'fs';
import os from 'os';
import path from 'path';

const isWindows = os.platform() === 'win32';

const isBaseDirectory = (p: string) => {
  const parsedPath = path.parse(p);
  return parsedPath.root === parsedPath.dir;
};

const searchUpwardsForEnvFile = (): string => {
  let currentPath = __dirname;
  while ((!isWindows && currentPath !== '/') ||
    (isWindows && !isBaseDirectory(currentPath))) {
    const envFilePath = path.join(currentPath, '.env.test');
    if (fs.existsSync(envFilePath)) {
      return currentPath;
    }

    currentPath = path.dirname(currentPath);
  }
  return '';
};

export default defineConfig({
  test: {
    env: {
      DOTENV_FLOW_PATH: searchUpwardsForEnvFile(),
      DOTENV_FLOW_PATTERN: '.env.test',
    },
    globals: true,
    setupFiles: ['./src/setup-tests.ts'],
  }
});
