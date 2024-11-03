import { defineWorkspace } from 'vitest/config';
import path from 'path';

export default defineWorkspace([path.join(__dirname, 'vitest.config.ts')]);
