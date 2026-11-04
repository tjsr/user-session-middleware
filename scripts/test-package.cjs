const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function firstNpmRecord(value) {
  return Array.isArray(value) ? value[0] : value.filename ? value : Object.values(value)[0];
}

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'usm-package-test-'));
const run = (command, args) => execFileSync(command, args, { cwd: directory, stdio: 'pipe' });
try {
  const npm = process.env.npm_execpath || fs.realpathSync(execFileSync('which', ['npm'], { encoding: 'utf8' }).trim());
  assert.ok(npm, 'Run this check with npm run test:package');
  fs.writeFileSync(path.join(directory, '.npmrc'), 'registry=https://registry.npmjs.org\n@tjsr:registry=https://npm.pkg.github.com\n');
  const packed = JSON.parse(run(process.execPath, [npm, 'pack', process.env.PACKAGE_TEST_SPEC || root, '--ignore-scripts', '--dry-run=false', '--json']));
  const packageDirectory = path.join(directory, 'node_modules/@tjsr/user-session-middleware');
  const archive = firstNpmRecord(packed).filename;
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
    name: 'middleware-production-consumer', version: '1.0.0', private: true,
    dependencies: { '@tjsr/user-session-middleware': 'file:' + path.resolve(directory, archive) },
  }));
  // Install only the tarball's declared production closure; never run its hooks.
  run(process.execPath, [npm, 'install', '--dry-run=false', '--omit=dev', '--ignore-scripts', '--strict-peer-deps',
    '--no-package-lock', '--no-audit', '--no-fund']);
  for (const developmentOnly of ['vitest', 'vitest-mock-express', 'typescript']) {
    assert.ok(!fs.existsSync(path.join(directory, 'node_modules', developmentOnly)),
      `Consumer must not inherit development-only ${developmentOnly}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
  assert.equal(manifest.name, require('../package.json').name);
  assert.equal(manifest.version, require('../package.json').version);
  for (const condition of ['import', 'require']) {
    for (const field of ['types', 'default']) {
      assert.ok(fs.existsSync(path.join(packageDirectory, manifest.exports['.'][condition][field])), `${condition}.${field} is missing from the packed distribution`);
    }
  }
  const fixture = `import { createUserIdFromEmail, getMysqlSessionStore, useUserSessionMiddleware, type UserSessionOptions } from '@tjsr/user-session-middleware';
import type { Response } from 'express';
import type { Store } from 'express-session';
const mysqlFactory: () => Store = getMysqlSessionStore;
const secret: UserSessionOptions['secret'] = 'fixture';
// @ts-expect-error Middleware cookie signing supports string secrets.
const binarySecret: UserSessionOptions['secret'] = new Uint8Array([1]);
// @ts-expect-error Middleware defaults merge static cookie options.
const cookieCallback: UserSessionOptions['cookie'] = () => ({ httpOnly: true });
declare const mysqlStore: ReturnType<typeof getMysqlSessionStore>;
// @ts-expect-error The published MySQL store must retain its concrete type.
mysqlStore.nonexistentMethod();
const customResponse = null as unknown as Response<string, { applicationField: string }>;
const applicationField: string = customResponse.locals.applicationField;
const id: string = createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'package@example.com');
const middleware: typeof useUserSessionMiddleware = useUserSessionMiddleware;
// @ts-expect-error The exported function must retain its email string argument type.
createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 123);
export { id, middleware, applicationField, mysqlFactory, secret };
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
  console.log('Production-only packed ESM/CommonJS declarations, runtime exports and HTTP error responses passed.');
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
