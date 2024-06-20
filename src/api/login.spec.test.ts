import { IdNamespace, SessionId } from '../types.js';
import { assert, beforeEach, describe, expect, test } from 'vitest';
import { hasRetrieveUserDataFunction, setRetrieveUserDataFunction } from '../auth/getDbUser.js';

import { ApiTestContext } from './utils/testcontext.js';
import { HttpStatusCode } from '../httpStatusCodes.js';
import { MemoryStore } from '../express-session/index.js';
import { SESSION_ID_HEADER_KEY } from '../getSession.js';
import { getSupertestSessionIdCookie } from '../utils/testing/cookieTestUtils.js';
import { setUserIdNamespaceForTest } from '../utils/testNamespaceUtils.js';
import supertest from 'supertest';
import { testableApp } from '../utils/testing/middlewareTestUtils.js';
import { validate } from 'uuid';

describe('api.login', () => {
  const createLoginBody = (email: string) => {
    return {
      email,
    };
  };

  // A new session ID should be generated for any authentication event
  beforeEach((context: ApiTestContext) => {
    const namespace: IdNamespace = setUserIdNamespaceForTest(context);
    context.userIdNamespace = namespace;
    context.sessionOptions = { store: new MemoryStore(), userIdNamespace: namespace };
  });

  test.todo('Requires express.json() to be added to middleware', () => {
  });

  test.todo('Check that express.json is not loaded twice as middleware', () => {
    // May be? loaded if we bind logout call.
  });

  test.todo('login call must have implemented a handler.', () => {
  });

  test('Should return a new sesion id and set as cookie with new credentials if already logged in with another user.',
    async (context: ApiTestContext) => {
      context.app = testableApp(context.sessionOptions);
      const loginBody = createLoginBody('test@example.com');

      let firstSessionId: SessionId | undefined = undefined;

      await supertest(context.app).post('/login').send(loginBody)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect((response) => {
          expect(response.statusCode).toEqual(HttpStatusCode.OK);

          firstSessionId = getSupertestSessionIdCookie(response);
          expect(firstSessionId).not.toBeUndefined();
          assert(validate(firstSessionId!), 'session ID should be a UUID value');
          expect(response.body.sessionId).toEqual(firstSessionId);
          expect(response.body.email, 'email in auth body should be provided email').toEqual('test@example.com');
        });

      const secondLoginBody = createLoginBody('test2@example.com');
      let secondSessionId: SessionId | undefined = undefined;

      console.log('-----', 'Starting second call');

      await supertest(context.app).post('/login').send(secondLoginBody)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set(SESSION_ID_HEADER_KEY, firstSessionId!)
        .expect((response) => {
          expect(response.statusCode).toEqual(HttpStatusCode.OK);

          secondSessionId = getSupertestSessionIdCookie(response);
          expect(secondSessionId).not.toBeUndefined();
          assert(validate(secondSessionId!), 'session ID should be a UUID value');
          expect(firstSessionId).not.toEqual(secondSessionId);
          expect(response.body.sessionId).toEqual(secondSessionId);
          expect(response.body.email, 'email in auth body should be provided email').toEqual('test2@example.com');
        });
    });

  test.todo('Should a 400 if a login call is provided without the required details for login.',
    (context: ApiTestContext) => {
      context.app = testableApp(context.sessionOptions);

      supertest(context.app).get('/login').expect(HttpStatusCode.OK);
    });

  test.todo('Should return a new sesion id with new credentials if already logged in with the same user.', () => {
  });

  test.todo('Should return a 403 and new session ID if login credential authentication fails.', () => {
  });

  test('Should return a 200 and new session ID if login credential authentication succeeds.',
    async (context: ApiTestContext) => {
      context.app = testableApp(context.sessionOptions);
      const loginBody = createLoginBody('test@example.com');

      let sessionId: SessionId | undefined = undefined;

      await supertest(context.app).post('/login').send(loginBody)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect((response) => {
          expect(response.statusCode).toEqual(HttpStatusCode.OK);

          sessionId = getSupertestSessionIdCookie(response);
          expect(sessionId).not.toBeUndefined();
          assert(validate(sessionId!), 'Cookie session ID should be a UUID value');
          console.log('Response body received', response.body);

          expect(response.body).not.toBeUndefined();
          expect(response.body.isLoggedIn).toEqual(true);
          expect(response.body.email, 'email in auth body should be provided email').toEqual('test@example.com');
          expect(response.body.sessionId, 'sessionId in body should match cookie sessionId').toEqual(sessionId);
        });
    });

  test('Should simply accept a user email from the json body if no custom user handler is configured.',
    async (context: ApiTestContext) => {
      setRetrieveUserDataFunction(undefined!);
      expect(hasRetrieveUserDataFunction()).toEqual(false);

      context.app = testableApp(context.sessionOptions);
      const loginBody = createLoginBody('test@example.com');

      await supertest(context.app).post('/login').send(loginBody)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect((response) => {
          const cookieSessionId = getSupertestSessionIdCookie(response);
          expect(cookieSessionId).not.toBeUndefined();
          assert(validate(cookieSessionId!), 'Cookie session ID should be a UUID value');

          expect(response.statusCode).toEqual(HttpStatusCode.OK);
          expect(response.body).not.toBeUndefined();
          expect(response.body.isLoggedIn).toEqual(true);
          expect(response.body.email, 'email in auth body should be provided email').toEqual('test@example.com');
          expect(response.body.sessionId, 'sessionId in body should match cookie sessionId').toEqual(cookieSessionId);
        });
    });
});
