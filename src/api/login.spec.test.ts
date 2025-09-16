import { ApiTestContext, setupApiTest, verifyAuthResponseBody, verifyAuthSessionId } from './utils/testcontext.ts';
import { hasRetrieveUserDataFunction, setRetrieveUserDataFunction } from '../auth/getDbUser.ts';
import { loginWithContext, setLoginUserLookupWithContextUserData } from '../utils/testing/apiTestUtils.ts';

import { HttpStatusCode } from '../httpStatusCodes.ts';
import { NoSessionTestContext } from '../utils/testing/context/session.ts';
import { SessionId } from '../types.ts';
import { TaskContext } from 'vitest';
import { forceHandlerAssertions } from '../middleware/handlerChainLog.ts';

describe('api.login', () => {
  beforeAll(() => {
    forceHandlerAssertions();
  });

  // A new session ID should be generated for any authentication event
  beforeEach((context: ApiTestContext<NoSessionTestContext> & TaskContext) => {
    setupApiTest(context);
  });

  test.todo('Requires express.json() to be added to middleware', () => {});

  test.todo('Check that express.json is not loaded twice as middleware', () => {
    // May be? loaded if we bind logout call.
  });

  test.todo('login call must have implemented a handler.', () => {});

  test('Login must have a request body', async (context: ApiTestContext) => {
    const response = await loginWithContext(context, null!);
    expect(response.statusCode).toEqual(HttpStatusCode.BAD_REQUEST);
  });

  test('email in login body must be a valid email address', async (context: ApiTestContext) => {
    const response = await loginWithContext(context, 'invalid-email@');
    expect(response.statusCode).toEqual(HttpStatusCode.BAD_REQUEST);
  });

  test('Should return a new sesion id and set as cookie with new credentials if already logged in with another user.', async (context: ApiTestContext) => {
    const response = await loginWithContext(context, 'test@example.com');
    expect(response.statusCode).toEqual(HttpStatusCode.OK);

    const firstSessionId = verifyAuthSessionId(response, context);
    verifyAuthResponseBody(response.body, 'test@example.com');

    const response2 = await loginWithContext(context, 'test2@example.com');
    expect(response2.statusCode).toEqual(HttpStatusCode.OK);

    const secondSessionId = verifyAuthSessionId(response2, context);
    verifyAuthResponseBody(response2.body, 'test2@example.com');

    expect(firstSessionId).not.toEqual(secondSessionId);
  });

  test.fails(
    'Should a 400 if a login call is provided without the required details for login.',
    async (context: ApiTestContext) => {
      const response = await loginWithContext(context, 'test@example.com');
      expect(response.statusCode).toEqual(HttpStatusCode.BAD_REQUEST);
    }
  );

  test('Should return a new sesion id with new credentials if already logged in with the same user.', async (context: ApiTestContext) => {
    const response = await loginWithContext(context, 'test@example.com');
    expect(response.statusCode).toEqual(HttpStatusCode.OK);

    const firstSessionId = verifyAuthSessionId(response, context);
    verifyAuthResponseBody(response.body, 'test@example.com');

    const response2 = await loginWithContext(context, 'test@example.com');
    expect(response2.statusCode).toEqual(HttpStatusCode.OK);

    const secondSessionId = verifyAuthSessionId(response2, context);
    verifyAuthResponseBody(response2.body, 'test@example.com');

    expect(firstSessionId).not.toEqual(secondSessionId);
  });

  test('Should return a 403 and regenerated session ID if login credential authentication fails.', async (context: ApiTestContext) => {
    const firstResponse = await loginWithContext(context, 'test@example.com');
    const firstSessionId: SessionId = verifyAuthSessionId(firstResponse, context);

    setLoginUserLookupWithContextUserData(context.userData);
    expect(hasRetrieveUserDataFunction()).toEqual(true);
    context.userData.set('failure@example.com', undefined);

    const secondResponse = await loginWithContext(context, 'failure@example.com');
    expect(secondResponse.statusCode).toEqual(HttpStatusCode.FORBIDDEN);
    verifyAuthResponseBody(secondResponse.body, undefined, false);
    const secondSessionId: SessionId = verifyAuthSessionId(secondResponse, context);

    expect(secondSessionId).not.toEqual(firstSessionId);
  });

  test('Should return a 403 and new session ID if login credential authentication fails.', async (context: ApiTestContext) => {
    context.sessionOptions.debugCallHandlers = true;
    setLoginUserLookupWithContextUserData(context.userData);
    expect(hasRetrieveUserDataFunction()).toEqual(true);
    context.userData.set('failure@example.com', undefined);

    const response = await loginWithContext(context, 'failure@example.com');
    expect(response.statusCode).toEqual(HttpStatusCode.FORBIDDEN);

    verifyAuthResponseBody(response.body, undefined, false);
    verifyAuthSessionId(response, context);
  });

  test('Should return a 200 and new session ID if login credential authentication succeeds.', async (context: ApiTestContext) => {
    const response = await loginWithContext(context, 'test@example.com');
    expect(response.statusCode, response.body?.error).toEqual(HttpStatusCode.OK);

    verifyAuthSessionId(response, context);
    verifyAuthResponseBody(response.body, 'test@example.com');
  });

  test('Should simply accept a user email from the json body if no custom user handler is configured.', async (context: ApiTestContext) => {
    setRetrieveUserDataFunction(undefined!);
    expect(hasRetrieveUserDataFunction()).toEqual(false);

    const response = await loginWithContext(context, 'test@example.com');
    expect(response.statusCode).toEqual(HttpStatusCode.OK);

    verifyAuthSessionId(response, context);
    verifyAuthResponseBody(response.body, 'test@example.com');
  });
});
