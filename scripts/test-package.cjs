const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function firstNpmRecord(value) {
  return Array.isArray(value) ? value[0] : value.filename ? value : Object.values(value)[0];
}

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(root, '.package-test-'));
const run = (command, args) => execFileSync(command, args, { cwd: directory, stdio: 'pipe' });
try {
  const npm = process.env.npm_execpath || fs.realpathSync(execFileSync('which', ['npm'], { encoding: 'utf8' }).trim());
  assert.ok(npm, 'Run this check with npm run test:package');
  const packed = JSON.parse(run(process.execPath, [npm, 'pack', process.env.PACKAGE_TEST_SPEC || root, '--ignore-scripts', '--dry-run=false', '--json']));
  const packageDirectory = path.join(directory, 'node_modules/@tjsr/user-session-middleware');
  fs.mkdirSync(packageDirectory, { recursive: true });
  run('tar', ['-xzf', firstNpmRecord(packed).filename, '-C', packageDirectory, '--strip-components=1']);
  const manifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
  assert.equal(manifest.name, require('../package.json').name);
  assert.equal(manifest.version, require('../package.json').version);
  for (const condition of ['import', 'require']) {
    for (const field of ['types', 'default']) {
      assert.ok(fs.existsSync(path.join(packageDirectory, manifest.exports['.'][condition][field])), `${condition}.${field} is missing from the packed distribution`);
    }
  }
  const fixture = `import { createUserIdFromEmail, useUserSessionMiddleware } from '@tjsr/user-session-middleware';
import type { Response } from 'express';
const customResponse = null as unknown as Response<string, { applicationField: string }>;
const applicationField: string = customResponse.locals.applicationField;
const id: string = createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'package@example.com');
const middleware: typeof useUserSessionMiddleware = useUserSessionMiddleware;
// @ts-expect-error The exported function must retain its email string argument type.
createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 123);
export { id, middleware, applicationField };
`;
  for (const extension of ['mts', 'cts']) {
    fs.writeFileSync(path.join(directory, `consumer.${extension}`), fixture);
    run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022', '--types', 'node', `consumer.${extension}`]);
  }
  const assertion = `if (typeof utils.useUserSessionMiddleware !== 'function' || utils.createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'package@example.com').length !== 36) throw new Error('Missing runtime export');`;
  const httpCheck = `
(async () => {
  const app = express();
  utils.useUserSessionMiddleware(app, {
    name: 'usm.sid', resave: false, saveUninitialized: false,
    secret: 'packed-http-test-only-secret', store: new session.MemoryStore(),
    userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  });
  app.get('/message', async (_request, response, next) => {
    await utils.endWithJsonMessage(response, 401, 'Unauthorized', next);
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const origin = 'http://127.0.0.1:' + server.address().port;
    for (const [route, status] of [['/login', 400], ['/message', 401]]) {
      const response = await fetch(origin + route);
      assert.equal(response.status, status);
      assert.equal(response.headers.get('content-type')?.split(';')[0], 'application/json');
      assert.equal(typeof (await response.json()).message, 'string');
    }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
`;
  fs.writeFileSync(path.join(directory, 'runtime.mjs'), `import assert from 'node:assert/strict';\nimport express from 'express';\nimport session from 'express-session';\nimport * as utils from '@tjsr/user-session-middleware';\n${assertion}\n${httpCheck}`);
  fs.writeFileSync(path.join(directory, 'runtime.cjs'), `const assert = require('node:assert/strict');\nconst express = require('express');\nconst session = require('express-session');\nconst utils = require('@tjsr/user-session-middleware');\n${assertion}\n${httpCheck}`);
  run(process.execPath, ['runtime.mjs']);
  run(process.execPath, ['runtime.cjs']);
  console.log('Packed ESM/CommonJS declarations, runtime exports and HTTP error responses passed.');
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
