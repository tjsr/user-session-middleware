import { ApiTestContext, setupApiTest } from './utils/testcontext.ts';
import { NoSessionTestContext, WithSessionTestContext, setupSessionContext } from '../utils/testing/context/session.ts';
import { TestContext, beforeEach, describe, expect, test } from 'vitest';
import { beginSession, refreshSession } from './utils/refreshSession.ts';
import { generateSessionSecretForTestName, setSessionCookie } from '@tjsr/testutils';

import { HttpStatusCode } from '../httpStatusCodes.ts';
import { SESSION_ID_COOKIE } from '../getSession.ts';
import { SessionId } from '../types.ts';
import { addDataToSessionStore } from '../testUtils.ts';
import { createUserIdFromEmail } from '../auth/user.ts';
import { generateSessionIdForTest } from '../utils/testing/testIdUtils.ts';
import { logoutWithContext } from '../utils/testing/apiTestUtils.ts';
import { mockSession } from '../utils/testing/mocks.ts';
import supertest from 'supertest';

describe<ApiTestContext<NoSessionTestContext> & TestContext>('api.nosession.logout', () => {
  beforeEach((context: ApiTestContext<WithSessionTestContext> & TestContext) => {
    setupApiTest(context);
  });

  test<
    ApiTestContext<WithSessionTestContext>
  >('Should return a 401 when a user is not currently logged in.', async (context) => {
    const refreshResponse = await beginSession(context);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const logoutResponse = await logoutWithContext(context);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
  });
});

describe<ApiTestContext<WithSessionTestContext> & TestContext>('api.withsession.logout', () => {
  const testUserEmail = 'test-user@example.com';

  beforeEach((context: ApiTestContext<WithSessionTestContext> & TestContext) => {
    setupApiTest(context, {
      debugCallHandlers: process.env['DEBUG'] ? true : false,
      secret: generateSessionSecretForTestName(context.task.name),
    });
  });

  test.fails.skip<ApiTestContext<WithSessionTestContext>>(
    'Should return a 401 when a user is not currently logged in.',
    async (context) => {
      const refreshResponse = await refreshSession(context, context.currentSessionId);
      expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
      const logoutResponse = await logoutWithContext(context);
      expect(logoutResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
    }
  );

  test('Should return a 401 no session is present.', async (context: ApiTestContext) => {
    const logoutResponse = await logoutWithContext(context);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
  });

  test('Should return a 200 when a user is logged in.', async (context: ApiTestContext<WithSessionTestContext>) => {
    context.sessionOptions.store!.set(
      context.currentSessionId,
      mockSession(context.sessionOptions.userIdNamespace, {
        email: testUserEmail,
      })
    );

    const logoutResponse = await logoutWithContext(context, context.currentSessionId);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.OK);
  });

  test<ApiTestContext<WithSessionTestContext>>('Should set session ID cookie to a new value.', async (context) => {
    const initialSessionId = context.currentSessionId;
    context.sessionOptions.store!.set(
      context.currentSessionId,
      mockSession(context.sessionOptions.userIdNamespace, {
        email: testUserEmail,
      })
    );

    const logoutResponse = await logoutWithContext(context, context.currentSessionId);
    expect(logoutResponse.statusCode).toEqual(HttpStatusCode.OK);
    expect(context.currentSessionId).not.toEqual(initialSessionId);
  });

  test<
    ApiTestContext<WithSessionTestContext>
  >('Should report 401 for invalid session ID when trying to re-use old session ID.', async (context) => {
    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(
      testSessionId,
      mockSession(context.sessionOptions.userIdNamespace, {
        email: testUserEmail,
      })
    );
    let st = supertest(context.app).get('/logout');
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, context.sessionOptions.secret!);
    await st.expect(HttpStatusCode.OK);

    let st2 = supertest(context.app).get('/logout');
    st2 = setSessionCookie(st2, SESSION_ID_COOKIE, testSessionId, context.sessionOptions.secret!);
    const st2response = await st2;
    expect(st2response.statusCode, st2response.body).toEqual(HttpStatusCode.UNAUTHORIZED);
  });

  test('Should return a 404 if logout call is disabled', async (context: ApiTestContext) => {
    context.sessionOptions.disableLoginEndpoints = true;

    return supertest(context.app).get('/signout').expect(HttpStatusCode.NOT_FOUND);
  });
});

describe('api.logout.logoutPath', () => {
  test<
    ApiTestContext<WithSessionTestContext>
  >('Should find logout at alternative path and return 200.', async (context) => {
    const testUserEmail = 'test-user@example.com';
    setupSessionContext(context, {
      logoutPath: '/signout',
    });

    const testSessionId: SessionId = context.currentSessionId;
    await addDataToSessionStore(context, {
      email: testUserEmail,
      userId: createUserIdFromEmail(context.sessionOptions.userIdNamespace, testUserEmail),
    });
    setupApiTest(context, context.sessionOptions);

    let st = supertest(context.app).get('/signout');
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, context.sessionOptions.secret!).expect(
      HttpStatusCode.OK
    );
    const response = await st;
    expect(response.status).toBe(HttpStatusCode.OK);
  });
});

describe('api.logout.logoutPath', () => {
  test('Should return a 404 at /logout if logout path is changed to not use default', async (context: ApiTestContext &
    WithSessionTestContext) => {
    setupSessionContext(context);
    await addDataToSessionStore(context, {});
    context.sessionOptions.debugCallHandlers = true;
    context.sessionOptions.logoutPath = '/signout';

    setupApiTest(context, {
      secret: generateSessionSecretForTestName(context.task.name),
    });

    const logoutResponse = supertest(context.app).get('/logout');
    return logoutResponse.expect(HttpStatusCode.NOT_FOUND);
  });

  test('Should return 404 at /logout with changed path and session Id', async (context: ApiTestContext &
    WithSessionTestContext) => {
    setupSessionContext(context);
    await addDataToSessionStore(context, {});
    context.sessionOptions.debugCallHandlers = true;
    context.sessionOptions.logoutPath = '/signout';

    setupApiTest(context, {
      secret: generateSessionSecretForTestName(context.task.name),
    });

    let logoutResponse = supertest(context.app).get('/logout');
    logoutResponse.set('Content-Type', 'application/json').accept('application/json');
    logoutResponse = setSessionCookie(
      logoutResponse,
      context.sessionOptions.name!,
      context.currentSessionId,
      context.sessionOptions.secret!
    );

    return logoutResponse.expect(HttpStatusCode.NOT_FOUND);
  });
});
