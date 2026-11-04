import { once } from 'node:events';
import { Server } from 'node:http';

import express, { ErrorRequestHandler, Express } from 'express';
import { MemoryStore } from 'express-session';

import { LoginBodyFormatError } from './errors/inputValidationErrorClasses.ts';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.ts';

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

const installSessionMiddleware = (app: Express): void => {
  useUserSessionMiddleware(app, {
    name: 'usm.sid',
    resave: false,
    saveUninitialized: false,
    secret: 'session-error-http-test-only-secret',
    store: new MemoryStore(),
    userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  });
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
