import { SessionDataTestContext, SessionTestContext } from '../../api/utils/testcontext.js';
import { createContextForSessionTest, createTestRequestSessionData } from '../../testUtils.js';
import { handleSessionCookie, handleSessionCookieOnError } from './handleSessionCookie.js';
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from '../../middlewareTestUtils.js';

import { MemoryStore } from 'express-session';
import { SessionStoreNotConfiguredError } from '../../errors/errorClasses.js';
import { appWithMiddleware } from '../../utils/testing/middlewareTestUtils.js';
import { expectResponseSetsSessionIdCookie } from '../../utils/expectations.js';
import { generateNewSessionId } from '../../session/sessionId.js';
import { getSetCookieString } from '@tjsr/testutils';
import { handleSessionStoreRequired } from './handleSessionStoreRequired.js';
import { sessionlessAppWithMiddleware } from '../../utils/testing/middlewareTestUtils.js';
import supertest from 'supertest';

describe('next.handleSessionStoreRequired', () => {
  test('Should fail when no sessionStore is available.', () => {
    verifyHandlerFunctionCallsNextWithError(handleSessionStoreRequired, { sessionStore: undefined });
  });
  test('Should not fail when a sessionStore is configured.', () => {
    verifyHandlerFunctionCallsNext(handleSessionStoreRequired, {
      sessionStore: new MemoryStore() as Express.SessionStore,
    });
  });
});

describe<SessionDataTestContext>('handler.handleSessionStoreRequired', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should error when a session store is not configured.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(
      context,
      { sessionStore: undefined },
      { skipAddToStore: true, skipCreateSession: true }
    );

    handleSessionStoreRequired(request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(SessionStoreNotConfiguredError));
  });

  test('Should not error if session store is configured.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(
      context,
      {},
      { skipAddToStore: true, skipCreateSession: true }
    );

    handleSessionStoreRequired(request, response, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe<SessionTestContext>('api.handleSessionStoreRequired', () => {
  beforeEach((context: SessionTestContext) => {
    context.sessionOptions = {
      name: 'test.sid',
      saveUninitialized: true,
    };
  });

  test('Should error on request when the session store is not configured.', async () => {
    const { app, memoryStore } = sessionlessAppWithMiddleware([handleSessionStoreRequired]);

    expect(memoryStore).toBeUndefined();
    const response = await supertest(app)
      .get('/')
      .set('Set-Cookie', getSetCookieString('cookie.test.sit', 'abc-1234'))
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(501);
  });

  test<SessionTestContext>('Should accept a request when the session store is configured.', async (context: SessionTestContext) => {
    const testSessionId = generateNewSessionId();
    const { app, memoryStore } = appWithMiddleware(
      [handleSessionStoreRequired, handleSessionCookie, handleSessionCookieOnError],
      undefined,
      context.sessionOptions
    );
    expect(memoryStore).not.toBeUndefined();
    const response = await supertest(app)
      .get('/')
      .set(context.sessionOptions.name!, testSessionId)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expectResponseSetsSessionIdCookie(context.sessionOptions.name!, response, testSessionId);
  });
});
