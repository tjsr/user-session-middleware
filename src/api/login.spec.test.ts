import { EmailAddress, IdNamespace, SessionId } from '../types.js';
import { assert, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { hasRetrieveUserDataFunction, setRetrieveUserDataFunction } from '../auth/getDbUser.js';
import { loginWith, setLoginUserLookupWithContextUserData } from '../utils/testing/apiTestUtils.js';

import { ApiTestContext } from './utils/testcontext.js';
import { HttpStatusCode } from '../httpStatusCodes.js';
import { MemoryStore } from '../express-session/index.js';
import { forceHandlerAssertions } from '../middleware/handlerChainLog.js';
import { setUserIdNamespaceForTest } from '../utils/testNamespaceUtils.js';
import supertest from 'supertest';
import { validate } from 'uuid';

describe('api.login', () => {
  beforeAll(() => {

    forceHandlerAssertions();
  });

  // A new session ID should be generated for any authentication event
  beforeEach((context: ApiTestContext) => {
    const namespace: IdNamespace = setUserIdNamespaceForTest(context);
    setRetrieveUserDataFunction(undefined!);
    context.userIdNamespace = namespace;
    context.sessionOptions = { debugCallHandlers: false, store: new MemoryStore(), userIdNamespace: namespace };
    context.userData = new Map();
  });

  test.todo('Requires express.json() to be added to middleware', () => {
  });

  test.todo('Check that express.json is not loaded twice as middleware', () => {
    // May be? loaded if we bind logout call.
  });

  test.todo('login call must have implemented a handler.', () => {
  });

  test('Login must have a request body', async (context: ApiTestContext) => {
    const response = await loginWith(context, undefined);
    expect(response.statusCode).toEqual(HttpStatusCode.BAD_REQUEST);
  });

  test('email in login body must be a valid email address', async (context: ApiTestContext) => {
    const response = await loginWith(context, 'invalid-email@');
    expect(response.statusCode).toEqual(HttpStatusCode.BAD_REQUEST);
  });

  const verifySessionId = (response: supertest.Response, context: ApiTestContext): SessionId => {
    expect(context.currentSessionId).not.toBeUndefined();
    assert(validate(context.currentSessionId!), 'session ID should be a UUID value');
    expect(response.body, 'Authentication response body expected to be present').not.toBeUndefined();
    expect(response.body.sessionId, 'Authentication response body expected to contain sessionId')
      .toEqual(context.currentSessionId);
    return context.currentSessionId!;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifyResponseBody = (body: any, email: EmailAddress|undefined, isLoggedIn: boolean = true) => {
    expect(body).not.toBeUndefined();
    expect(body.isLoggedIn).toEqual(isLoggedIn);
    if (email === undefined) {
      expect(body.email, 'email should not be defined').toBeUndefined();
    } else {
      expect(body.email, 'email in auth body should be provided email').toEqual(email);
    }
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

  test('Should return a 403 and regenerated session ID if login credential authentication fails.',
    async(context: ApiTestContext) => {
      const firstResponse = await loginWith(context, 'test@example.com');
      const firstSessionId: SessionId = verifySessionId(firstResponse, context);
      
      setLoginUserLookupWithContextUserData(context.userData);
      expect(hasRetrieveUserDataFunction()).toEqual(true);
      context.userData.set('failure@example.com', undefined);

      const secondResponse = await loginWith(context, 'failure@example.com');
      expect(secondResponse.statusCode).toEqual(HttpStatusCode.FORBIDDEN);
      verifyResponseBody(secondResponse.body, undefined, false);
      const secondSessionId: SessionId = verifySessionId(secondResponse, context);

      expect(secondSessionId).not.toEqual(firstSessionId);
    });

  test('Should return a 403 and new session ID if login credential authentication fails.',
    async(context: ApiTestContext) => {
      context.sessionOptions.debugCallHandlers = true;
      setLoginUserLookupWithContextUserData(context.userData);
      expect(hasRetrieveUserDataFunction()).toEqual(true);
      context.userData.set('failure@example.com', undefined);

      const response = await loginWith(context, 'failure@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.FORBIDDEN);

      verifyResponseBody(response.body, undefined, false);
      verifySessionId(response, context);
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
