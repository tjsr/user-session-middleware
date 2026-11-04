const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');

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
  const vendorArchive = path.join(packageDirectory, 'vendor/express-mysql-session-types-3.0.8-mysql2-3.10.2.tgz');
  assert.equal(createHash('sha256').update(fs.readFileSync(vendorArchive)).digest('hex'),
    '20e2990371ad72a391dab1e1039bfb45b1cc0d6a0956335846047b069f400b62');
  assert.deepEqual(manifest.bundledDependencies, ['@types/express-mysql-session']);
  assert.ok(fs.existsSync(path.join(packageDirectory, 'node_modules/@types/express-mysql-session/LICENSE')));
  const consumerRequire = createRequire(path.join(directory, 'package.json'));
  const libraryRequire = createRequire(path.join(packageDirectory, 'package.json'));
  const storeRequire = createRequire(libraryRequire.resolve('express-mysql-session'));
  const providerRequire = createRequire(libraryRequire.resolve('@types/express-mysql-session/package.json'));
  assert.equal(storeRequire('mysql2/package.json').version, '3.10.2');
  assert.equal(providerRequire('mysql2/package.json').version, '3.10.2');
  assert.equal(providerRequire('./package.json').tjsrVendorPatch.sourceIntegrity,
    'sha512-ljtWFQZHQDIzr/FfQYa/twmdm871uJOMJz7a6hPRBaeBpw49pCBxUYfb56N3troI8i8uHsKjYJ1lpZhSlYl25w==');
  assert.deepEqual(fs.readFileSync(providerRequire.resolve('./index.d.ts')),
    fs.readFileSync(path.join(packageDirectory, 'vendor/express-mysql-session-types/index.d.ts')));
  const fixture = `import { createUserIdFromEmail, getMysqlSessionStore, useUserSessionMiddleware, type UserSessionOptions } from '@tjsr/user-session-middleware';
import type { Response } from 'express';
import { createSecretKey } from 'node:crypto';
import type { Store, SessionOptions } from 'express-session';
const mysqlFactory: () => Store = getMysqlSessionStore;
const secret: UserSessionOptions['secret'] = 'fixture';
const binarySecret: UserSessionOptions['secret'] = Buffer.from('fixture');
const objectSecret: UserSessionOptions['secret'] = createSecretKey(Buffer.from('fixture'));
const rotatingSecrets: UserSessionOptions['secret'] = [binarySecret, objectSecret];
const cookieCallback: UserSessionOptions['cookie'] = request => ({ httpOnly: true, path: request.path });
declare const upstreamOptions: SessionOptions;
const options: UserSessionOptions = { ...upstreamOptions, userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' };
const upstreamCompatible: SessionOptions = options;
declare const mysqlStore: ReturnType<typeof getMysqlSessionStore>;
// @ts-expect-error The published MySQL store must retain its concrete type.
mysqlStore.nonexistentMethod();
declare const customResponse: Response<string, { applicationField: string }>;
const applicationField: string = customResponse.locals.applicationField;
const id: string = createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'package@example.com');
const middleware: typeof useUserSessionMiddleware = useUserSessionMiddleware;
// @ts-expect-error The exported function must retain its email string argument type.
createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 123);
export { id, middleware, applicationField, mysqlFactory, secret, binarySecret, objectSecret, rotatingSecrets, cookieCallback, upstreamCompatible };
`;
  for (const extension of ['mts', 'cts']) {
    fs.writeFileSync(path.join(directory, `consumer.${extension}`), fixture);
    run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022', '--types', 'node', `consumer.${extension}`]);
  }
  const drivers = JSON.parse(run(process.execPath, [npm, 'query', '[name="mysql2"]', '--json']));
  assert.ok(drivers.length > 0, 'The production MySQL dependency closure must be inspected');
  for (const driver of drivers) {
    assert.ok(require('semver').satisfies(driver.version, '>=3.10.0 <4'), `Unsupported production mysql2 ${driver.version}`);
  }
  const assertion = `if (typeof utils.useUserSessionMiddleware !== 'function' || utils.createUserIdFromEmail('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'package@example.com').length !== 36) throw new Error('Missing runtime export');`;
  const httpCheck = `
(async () => {
  for (const runtimeSecret of [Buffer.from('packed-buffer-secret-http-test'), createSecretKey(Buffer.from('packed-object-secret-http-test')), [Buffer.from('packed-new-secret-http-test'), createSecretKey(Buffer.from('packed-old-secret-http-test'))]]) {
  const app = express();
  utils.useUserSessionMiddleware(app, {
    name: 'usm.sid', resave: false, saveUninitialized: false,
    secret: runtimeSecret, store: new session.MemoryStore(),
    cookie: request => ({ httpOnly: true, path: request.path, secure: false, sameSite: 'lax' }),
    userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  });
  app.get('/message', async (_request, response, next) => {
    await utils.endWithJsonMessage(response, 401, 'Unauthorized', next);
  });
  app.get('/counter', (request, response) => {
    request.session.email = String(Number(request.session.email || '0') + 1);
    response.json({ id: request.sessionID, visits: Number(request.session.email) });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const origin = 'http://127.0.0.1:' + server.address().port;
    const initial = await fetch(origin + '/counter');
    assert.equal(initial.status, 200);
    const first = await initial.json();
    assert.equal(first.visits, 1);
    const cookie = initial.headers.get('set-cookie');
    assert.ok(cookie?.includes('Path=/counter'));
    assert.ok(cookie?.includes('HttpOnly'));
    assert.ok(cookie?.includes('SameSite=Lax'));
    const reused = await fetch(origin + '/counter', { headers: { cookie: cookie.split(';')[0] } });
    assert.equal(reused.status, 200);
    assert.deepEqual(await reused.json(), { id: first.id, visits: 2 });
    for (const [route, status] of [['/login', 400], ['/message', 401]]) {
      const response = await fetch(origin + route);
      assert.equal(response.status, status);
      assert.equal(response.headers.get('content-type')?.split(';')[0], 'application/json');
      assert.equal(typeof (await response.json()).message, 'string');
    }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
`;
  fs.writeFileSync(path.join(directory, 'runtime.mjs'), `import assert from 'node:assert/strict';\nimport { createSecretKey } from 'node:crypto';\nimport express from 'express';\nimport session from 'express-session';\nimport * as utils from '@tjsr/user-session-middleware';\n${assertion}\n${httpCheck}`);
  fs.writeFileSync(path.join(directory, 'runtime.cjs'), `const assert = require('node:assert/strict');\nconst { createSecretKey } = require('node:crypto');\nconst express = require('express');\nconst session = require('express-session');\nconst utils = require('@tjsr/user-session-middleware');\n${assertion}\n${httpCheck}`);
  run(process.execPath, ['runtime.mjs']);
  run(process.execPath, ['runtime.cjs']);
  // A consumer may already depend on the registry provider. Keep its nominal
  // MySQL store identity compatible with the dependency-only vendor patch.
  // Its old driver is owned by that explicit consumer dependency; the preceding
  // isolated production-closure check proves the middleware does not add it.
  run(process.execPath, [npm, 'install', '@types/express-mysql-session@3.0.8', '--save-exact',
    '--dry-run=false', '--omit=dev', '--ignore-scripts', '--strict-peer-deps', '--no-package-lock', '--no-audit', '--no-fund']);
  assert.equal(consumerRequire('@types/express-mysql-session/package.json').version, '3.0.8');
  const identityFixture = `import { getMysqlSessionStore } from '@tjsr/user-session-middleware';
import type { MySQLStore } from 'express-mysql-session';
declare const middlewareStore: ReturnType<typeof getMysqlSessionStore>;
declare const officialStore: MySQLStore;
const fromMiddleware: MySQLStore = middlewareStore;
const fromOfficial: ReturnType<typeof getMysqlSessionStore> = officialStore;
export { fromMiddleware, fromOfficial };
`;
  for (const extension of ['mts', 'cts']) {
    fs.writeFileSync(path.join(directory, `identity.${extension}`), identityFixture);
    run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022', '--types', 'node', `identity.${extension}`]);
  }
  console.log('Production-only packed ESM/CommonJS declarations, runtime exports and HTTP error responses passed.');
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
