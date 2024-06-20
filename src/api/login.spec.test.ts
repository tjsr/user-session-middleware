import { EmailAddress, IdNamespace, SessionId } from '../types.js';
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

  const loginWith = async (context: ApiTestContext, email?: EmailAddress, sessionId?: SessionId) => {
    if (!context.app) {
      context.app = testableApp(context.sessionOptions);
    }

    let st = supertest(context.app).post('/login');
    
    if (email) {
      const loginBody = createLoginBody(email);
      st = st.send(loginBody);
    }
    
    st.set('Content-Type', 'application/json')
      .accept('application/json');

    if (sessionId) {
      st = st.set(SESSION_ID_HEADER_KEY, sessionId);
    } else if (context.currentSessionId) {
      st = st.set(SESSION_ID_HEADER_KEY, context.currentSessionId);
    }
    const response = await st;
    context.currentSessionId = getSupertestSessionIdCookie(response);

    return response;
  };

  const verifySessionId = (response: supertest.Response, context: ApiTestContext): SessionId => {
    expect(context.currentSessionId).not.toBeUndefined();
    assert(validate(context.currentSessionId!), 'session ID should be a UUID value');
    expect(response.body.sessionId).toEqual(context.currentSessionId);
    return context.currentSessionId!;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifyResponseBody = (body: any, email: EmailAddress, isLoggedIn: boolean = true) => {
    expect(body).not.toBeUndefined();
    expect(body.isLoggedIn).toEqual(isLoggedIn);
    expect(body.email, 'email in auth body should be provided email').toEqual(email);
  };

  test('Should return a new sesion id and set as cookie with new credentials if already logged in with another user.',
    async (context: ApiTestContext) => {
      const response = await loginWith(context, 'test@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.OK);

      const firstSessionId = verifySessionId(response, context);
      verifyResponseBody(response.body, 'test@example.com');

      const response2 = await loginWith(context, 'test2@example.com');
      expect(response2.statusCode).toEqual(HttpStatusCode.OK);

      const secondSessionId = verifySessionId(response2, context);
      verifyResponseBody(response2.body, 'test2@example.com');

      expect(firstSessionId).not.toEqual(secondSessionId);
    });

  test.fails('Should a 400 if a login call is provided without the required details for login.',
    async (context: ApiTestContext) => {
      const response = await loginWith(context, 'test@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.BAD_REQUEST);
    });

  test('Should return a new sesion id with new credentials if already logged in with the same user.',
    async (context: ApiTestContext) => {
      const response = await loginWith(context, 'test@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.OK);

      const firstSessionId = verifySessionId(response, context);
      verifyResponseBody(response.body, 'test@example.com');

      const response2 = await loginWith(context, 'test@example.com');
      expect(response2.statusCode).toEqual(HttpStatusCode.OK);

      const secondSessionId = verifySessionId(response2, context);
      verifyResponseBody(response2.body, 'test@example.com');

      expect(firstSessionId).not.toEqual(secondSessionId);
    });

  test.todo('Should return a 403 and new session ID if login credential authentication fails.', () => {
  });

  test('Should return a 200 and new session ID if login credential authentication succeeds.',
    async (context: ApiTestContext) => {
      const response = await loginWith(context, 'test@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.OK);

      verifySessionId(response, context);
      verifyResponseBody(response.body, 'test@example.com');
    });

  test('Should simply accept a user email from the json body if no custom user handler is configured.',
    async (context: ApiTestContext) => {
      setRetrieveUserDataFunction(undefined!);
      expect(hasRetrieveUserDataFunction()).toEqual(false);

      const response = await loginWith(context, 'test@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.OK);

      verifySessionId(response, context);
      verifyResponseBody(response.body, 'test@example.com');
    });
});
