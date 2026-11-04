const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

// Builds and lifecycle tests run before this check. Inspect the actual pack list
// without running them recursively; no registry publishing is involved.
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const [pack] = JSON.parse(execFileSync(npm, ['pack', '--dry-run', '--ignore-scripts', '--json'], {
  encoding: 'utf8',
}));
const files = new Set(pack.files.map((file) => file.path));
for (const path of ['dist/esm/index.js', 'dist/esm/index.d.ts', 'dist/cjs/index.js',
  'dist/cjs/index.d.ts', 'dist/cjs/package.json']) {
  assert.ok(files.has(path), `Package is missing ${path}`);
}

(async () => {
  const esm = await import(pathToFileURL(resolve('dist/esm/index.js')).href);
  const cjs = require(resolve('dist/cjs/index.js'));
  for (const entry of [esm, cjs]) {
    assert.equal(typeof entry.useUserSessionMiddleware, 'function');
    assert.equal(typeof entry.createUserIdFromEmail, 'function');
  }
  console.log('Packed ESM and CommonJS entry points exist and load successfully');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
