import { createSecretKey } from 'node:crypto';
import { once } from 'node:events';
import { Server } from 'node:http';

import express, { ErrorRequestHandler, Express } from 'express';
import session, { MemoryStore } from 'express-session';

import { setRetrieveUserDataFunction } from './auth/getDbUser.ts';
import { LoginCredentialsError } from './errors/authenticationErrorClasses.ts';
import { SessionNotGeneratedError } from './errors/errorClasses.ts';
import { LoginBodyFormatError } from './errors/inputValidationErrorClasses.ts';
import { defaultExpressSessionOptions } from './getSession.ts';
import { UserSessionOptions } from './types/sessionOptions.ts';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.ts';
import { endWithJsonMessage, validateHasUserId } from './utils/apiMiddlewareUtils.ts';

let server: Server | undefined;

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => server!.close((error) => (error ? reject(error) : resolve())));
    server = undefined;
  }
});

const listen = async (app: Express): Promise<string> => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  return `http://127.0.0.1:${address.port}`;
};

const sessionOptions = (): UserSessionOptions => ({
  name: 'usm.sid',
  resave: false,
  saveUninitialized: false,
  secret: 'session-error-http-test-only-secret',
  store: new MemoryStore(),
  userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
});

const installSessionMiddleware = (app: Express): void => {
  useUserSessionMiddleware(app, sessionOptions());
};

test('finishes handled login errors with the default Express error path', async () => {
  const app = express();
  installSessionMiddleware(app);
  app.get('/health', (_request, response) => response.json({ ok: true }));
  const origin = await listen(app);
  const health = await fetch(`${origin}/health`);
  expect(await health.json()).toEqual({ ok: true });

  for (const options of [
    undefined,
    { body: 'email=test@example.com', headers: { 'content-type': 'text/plain' }, method: 'POST' },
  ]) {
    const response = await fetch(`${origin}/login`, options);
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    expect(await response.json()).toEqual({ message: expect.any(String) });
  }
});

test('delegates unhandled errors to the application error handler', async () => {
  const app = express();
  const failure = new Error('application error fixture');
  app.use((_request, _response, next) => next(failure));
  installSessionMiddleware(app);
  const handler: ErrorRequestHandler = (error, _request, response, _next) => {
    expect(error).toBe(failure);
    response.status(503).json({ message: 'application handled error' });
  };
  app.use(handler);

  const response = await fetch(await listen(app));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ message: 'application handled error' });
});

test('delegates the original error when response headers were already sent', async () => {
  const app = express();
  const failure = new LoginBodyFormatError('partially sent response fixture');
  app.use((_request, response, next) => {
    response.write('partial ');
    next(failure);
  });
  installSessionMiddleware(app);
  const handler: ErrorRequestHandler = (error, _request, response, _next) => {
    expect(error).toBe(failure);
    response.end('response');
  };
  app.use(handler);

  const response = await fetch(await listen(app));
  expect(await response.text()).toBe('partial response');
});

const installExpressSession = (app: Express): void => {
  app.use(
    session({
      name: 'usm.sid',
      resave: false,
      saveUninitialized: true,
      secret: 'session-message-test-only-secret',
      store: new MemoryStore(),
    })
  );
};

test('finishes an authentication result response after a failed login', async () => {
  const app = express();
  installSessionMiddleware(app);
  setRetrieveUserDataFunction(async () => {
    throw new LoginCredentialsError();
  });
  try {
    const response = await fetch(`${await listen(app)}/login`, {
      body: JSON.stringify({ email: 'rejected@example.com' }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ isLoggedIn: false, sessionId: expect.any(String) });
  } finally {
    // The existing setter permits clearing its callback at runtime.
    setRetrieveUserDataFunction(undefined!);
  }
});

test.each([true, false])('finishes an exported JSON helper response (next callback: %s)', async (withNext) => {
  const app = express();
  installExpressSession(app);
  app.get('/message', async (_request, response, next) => {
    await endWithJsonMessage(response, 401, 'Unauthorized', withNext ? next : undefined, { reason: 'fixture' });
  });
  const response = await fetch(`${await listen(app)}/message`);
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ message: 'Unauthorized', reason: 'fixture' });
});

test('finishes a validation error response when application session configuration is missing', async () => {
  const app = express();
  installExpressSession(app);
  app.get('/protected', validateHasUserId);
  const response = await fetch(`${await listen(app)}/protected`);
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: 'Invalid user' });
});

test('forwards an unhandled user-session lookup error to the application', async () => {
  const app = express();
  app.locals['sessionOptions'] = sessionOptions();
  app.get('/protected', validateHasUserId);
  const handler: ErrorRequestHandler = (error, _request, response, _next) => {
    expect(error).toBeInstanceOf(SessionNotGeneratedError);
    response.status(503).json({ message: 'application handled lookup failure' });
  };
  app.use(handler);
  const response = await fetch(`${await listen(app)}/protected`);
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ message: 'application handled lookup failure' });
});

for (const withDefaults of [false, true]) {
  test.each([
    ['Buffer', Buffer.from('buffer-secret-for-http-session-test')],
    ['KeyObject', createSecretKey(Buffer.from('key-object-secret-for-http-session-test'))],
    [
      'rotating keys',
      [Buffer.from('rotating-buffer-key-for-http-test'), createSecretKey(Buffer.from('old-key-for-http-test'))],
    ],
  ])(
    `reuses a signed session with %s and per-request cookie options (defaults: ${withDefaults})`,
    async (_name, secret) => {
      const app = express();
      const cookie = vi.fn((request: express.Request) => ({
        httpOnly: true,
        path: request.path,
        sameSite: 'lax' as const,
        secure: false,
      }));
      const options: UserSessionOptions = { ...sessionOptions(), cookie, secret };
      useUserSessionMiddleware(app, withDefaults ? { ...options, ...defaultExpressSessionOptions(options) } : options);
      app.get('/counter', (request, response) => {
        const visits = Number(request.session.email || '0') + 1;
        request.session.email = String(visits);
        response.json({ id: request.sessionID, visits });
      });
      const origin = await listen(app);
      const initial = await fetch(`${origin}/counter`, { headers: { 'x-cookie-fixture': 'initial' } });
      expect(initial.status).toBe(200);
      const first: unknown = await initial.json();
      if (
        !first ||
        typeof first !== 'object' ||
        !('id' in first) ||
        typeof first.id !== 'string' ||
        !('visits' in first) ||
        typeof first.visits !== 'number'
      ) {
        throw new Error('Expected a session id and numeric visit count');
      }
      expect(first.visits).toBe(1);
      const setCookie = initial.headers.get('set-cookie');
      expect(setCookie).toContain('Path=/counter');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');
      const reused = await fetch(`${origin}/counter`, {
        headers: { cookie: setCookie!.split(';')[0]!, 'x-cookie-fixture': 'reused' },
      });
      expect(reused.status).toBe(200);
      expect(await reused.json()).toEqual({ id: first.id, visits: 2 });
      expect(cookie.mock.calls.map(([request]) => request.headers['x-cookie-fixture'])).toEqual(
        expect.arrayContaining(['initial', 'reused'])
      );
    }
  );
}
