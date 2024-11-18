import { ApiTestContext, WithSessionTestContext, refreshSession, setupApiTest } from './utils/testcontext.js';
import { beforeEach, describe, expect, test } from 'vitest';

import { Cookie } from '../express-session/index.js';
import { HttpStatusCode } from '../httpStatusCodes.js';
import { SESSION_ID_COOKIE } from '../getSession.js';
import { SessionId } from '../types.js';
import { createUserIdFromEmail } from '../auth/user.js';
import { generateSessionIdForTest } from '../utils/testIdUtils.js';
import { logoutFrom } from '../utils/testing/apiTestUtils.js';
import { mockSession } from '../utils/testing/mocks.js';
import { setSessionCookie } from '@tjsr/testutils';
import supertest from 'supertest';
import { testableApp } from '../utils/testing/middlewareTestUtils.js';

describe('api.logout', () => {
  const testUserEmail = 'test-user@example.com';

  beforeEach((context: ApiTestContext) => setupApiTest(context));

  test('Should return a 401 when a user is not currently logged in.', async (context: ApiTestContext<WithSessionTestContext>) => {
    const refreshResponse = await refreshSession(context, context.currentSessionId);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const logoutResponse = await logoutFrom(context);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
  });

  test('Should return a 401 no session is present.', async (context: ApiTestContext) => {
    const logoutResponse = await logoutFrom(context);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
  });

  test('Should return a 200 when a user is logged in.', async (context: ApiTestContext) => {
    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(
      testSessionId,
      mockSession(context.userIdNamespace, {
        email: testUserEmail,
      })
    );

    const logoutResponse = await logoutFrom(context, testSessionId);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.OK);
  });

  test('Should set session ID cookie to a new value.', async (context: ApiTestContext) => {
    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(
      testSessionId,
      mockSession(context.userIdNamespace, {
        email: testUserEmail,
      })
    );

    const logoutResponse = await logoutFrom(context, testSessionId);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.OK);
    expect(context.currentSessionId).not.toEqual(testSessionId);
  });

  test('Should report 401 for invalid session ID when trying to re-use old session ID.', async (context: ApiTestContext) => {
    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(
      testSessionId,
      mockSession(context.userIdNamespace, {
        email: testUserEmail,
      })
    );
    const app = testableApp(context.sessionOptions);
    let st = supertest(app).get('/logout');
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, context.sessionOptions.secret!);
    await st.expect(HttpStatusCode.OK);

    let st2 = supertest(app).get('/logout');
    st2 = setSessionCookie(st2, SESSION_ID_COOKIE, testSessionId, context.sessionOptions.secret!);
    await st2.expect(HttpStatusCode.UNAUTHORIZED);
  });

  test('Should return a 404 if logout call is disabled', async (context: ApiTestContext) => {
    context.sessionOptions.disableLoginEndpoints = true;

    const app = testableApp(context.sessionOptions);
    return supertest(app).get('/signout').expect(HttpStatusCode.NOT_FOUND);
  });

  test('Should return a 404 at /logout if logout path is changed to not use default', async (context: ApiTestContext) => {
    context.sessionOptions.debugCallHandlers = true;
    context.sessionOptions.logoutPath = '/signout';

    const app = testableApp(context.sessionOptions);
    return supertest(app).get('/logout').expect(HttpStatusCode.NOT_FOUND);
  });

  test('Should find logout at alternative path and return 200.', async (context: ApiTestContext) => {
    context.sessionOptions.logoutPath = '/signout';

    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(testSessionId, {
      cookie: new Cookie(),
      email: testUserEmail,
      hasLoggedOut: false,
      newId: false,
      userId: createUserIdFromEmail(context.userIdNamespace, testUserEmail),
    });
    const app = testableApp(context.sessionOptions);

    let st = supertest(app).get('/signout');
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, context.sessionOptions.secret!).expect(
      HttpStatusCode.OK
    );
    const response = await st;
    expect(response.status).toBe(HttpStatusCode.OK);
  });
});
