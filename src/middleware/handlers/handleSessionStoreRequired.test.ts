import { SESSION_ID_COOKIE, SESSION_SECRET } from '../../getSession.js';
import { createContextForSessionTest, createTestRequestSessionData } from '../../testUtils.js';
import { expectResponseSetsSessionIdCookie, setSessionCookie } from '@tjsr/testutils';
import { handleSessionCookie, handleSessionCookieOnError } from './handleSessionCookie.js';
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from '../../middlewareTestUtils.js';

import { MemoryStore } from 'express-session';
import { SessionDataTestContext } from '../../api/utils/testcontext.js';
import { SessionStoreNotConfiguredError } from '../../errors/errorClasses.js';
import { appWithMiddleware } from '../../utils/testing/middlewareTestUtils.js';
import { generateNewSessionId } from '../../session/sessionId.js';
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

describe('api.handleSessionStoreRequired', () => {
  test('Should error on request when the session store is not configured.', async () => {
    const { app, memoryStore } = sessionlessAppWithMiddleware([handleSessionStoreRequired]);

    expect(memoryStore).toBeUndefined();
    const response = await supertest(app).get('/').set('Content-Type', 'application/json');

    expect(response.status).toBe(501);
  });

  test('Should accept a request when the session store is configured.', async () => {
    const testSessionId = generateNewSessionId();
    const { app, memoryStore } = appWithMiddleware(
      [handleSessionStoreRequired, handleSessionCookie, handleSessionCookieOnError],
      undefined
    );
    expect(memoryStore).not.toBeUndefined();

    let st = supertest(app).get('/').set('Content-Type', 'application/json');
    console.log('in api.handleSessionStoreRequired: sessionId', SESSION_ID_COOKIE, testSessionId);
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, SESSION_SECRET);
    const response = await st;

    expect(response.status).toBe(200);
    expectResponseSetsSessionIdCookie(response, SESSION_ID_COOKIE, testSessionId, SESSION_SECRET);
  });
});
