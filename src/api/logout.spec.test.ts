import { ApiTestContext, setupApiTest } from "./utils/testcontext.js";
import { beforeEach, describe, test } from "vitest";

import { Cookie } from "../express-session/index.js";
import { HttpStatusCode } from "../httpStatusCodes.js";
import { SESSION_ID_HEADER_KEY } from "../getSession.js";
import { SessionId } from "../types.js";
import { createUserIdFromEmail } from "../auth/user.js";
import { expectResponseResetsSessionIdCookie } from "../utils/expectations.js";
import { generateSessionIdForTest } from "../utils/testIdUtils.js";
import { mockSession } from "../utils/testing/mocks.js";
import supertest from "supertest";
import { testableApp } from "../utils/testing/middlewareTestUtils.js";

describe('api.logout', () => {
  const testUserEmail = 'test-user@example.com';

  beforeEach((context: ApiTestContext) => setupApiTest(context));

  test('Should return a 401 when a user is not currently logged in.', async (context: ApiTestContext) => {
    const app = testableApp(context.sessionOptions);
    return supertest(app).get('/logout').expect(HttpStatusCode.UNAUTHORIZED);
  });

  test('Should return a 200 when a user is logged in.', async (context: ApiTestContext) => {
    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(testSessionId, mockSession({
      email: testUserEmail,
    }));
    const app = testableApp(context.sessionOptions);
    return supertest(app).get('/logout').set(SESSION_ID_HEADER_KEY, testSessionId).expect(HttpStatusCode.OK);
  });

  test('Should set session ID cookie to a new value.', async (context: ApiTestContext) => {
    const testSessionId: SessionId = generateSessionIdForTest(context);
    context.sessionOptions.store!.set(testSessionId, mockSession({
      email: testUserEmail,
    }));
    const app = testableApp(context.sessionOptions);
    return supertest(app).get('/logout').set(SESSION_ID_HEADER_KEY, testSessionId).expect((response) => {
      expectResponseResetsSessionIdCookie(response, testSessionId);
    });
  });

  test('Should report 401 for invalid session ID when trying to re-use old session ID.',
    async (context: ApiTestContext) => {
      const testSessionId: SessionId = generateSessionIdForTest(context);
      context.sessionOptions.store!.set(testSessionId, mockSession({
        email: testUserEmail,
      }));
      const app = testableApp(context.sessionOptions);
      await supertest(app).get('/logout').set(SESSION_ID_HEADER_KEY, testSessionId).expect(HttpStatusCode.OK);
      await supertest(app).get('/logout').set(SESSION_ID_HEADER_KEY, testSessionId).expect(HttpStatusCode.UNAUTHORIZED);
    });

  test('Should return a 404 if logout call is disabled', async (context: ApiTestContext) => {
    context.sessionOptions.disableLoginEndpoints = true;

    const app = testableApp(context.sessionOptions);
    return supertest(app).get('/signout').expect(HttpStatusCode.NOT_FOUND);
  });

  test('Should return a 404 at /logout if logout path is changed to not use default',
    async (context: ApiTestContext) => {
      context.sessionOptions.debugCallHandlers = true;
      context.sessionOptions.logoutPath = '/signout';

      const app = testableApp(context.sessionOptions);
      return supertest(app).get('/logout').expect(HttpStatusCode.NOT_FOUND);
    });

  test('Should find logout at alternative path and return 200.',
    async (context: ApiTestContext) => {
      context.sessionOptions.logoutPath = '/signout';

      const testSessionId: SessionId = generateSessionIdForTest(context);
      context.sessionOptions.store!.set(testSessionId, {
        cookie: new Cookie(),
        email: testUserEmail,
        hasLoggedOut: false,
        newId: false,
        userId: createUserIdFromEmail(testUserEmail),
      });
      const app = testableApp(context.sessionOptions);
      return supertest(app).get('/signout').set(SESSION_ID_HEADER_KEY, testSessionId).expect(HttpStatusCode.OK);
    });
});
