import { ApiTestContext, MiddlewareHandlerTestContext, SessionDataTestContext } from '../../api/utils/testcontext.ts';
import { SessionTestContext, setupSessionContext } from '../../utils/testing/context/session.ts';
import { createContextForSessionTest, createTestRequestSessionData } from '../../testUtils.ts';
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from '../../middlewareTestUtils.ts';

import { MemoryStore } from 'express-session';
import { SessionEnabledRequestContext } from '../../utils/testing/context/request.ts';
import { SessionStoreNotConfiguredError } from '../../errors/errorClasses.ts';
import { TaskContext } from 'vitest';
import { createHandlerTestContext } from '../../utils/testing/handlerTestutils.ts';
import { expectResponseSetsSessionIdCookie } from '@tjsr/testutils';
import { handleSessionStoreRequired } from './handleSessionStoreRequired.ts';
import { setupSupertestContext } from '../../utils/testing/supertestUtils.ts';

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

describe<SessionEnabledRequestContext>('handler.handleSessionStoreRequired', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
  });

  test('Should error when a session store is not configured.', async (context: SessionEnabledRequestContext) => {
    const { next, request, response } = createTestRequestSessionData(
      context,
      { sessionStore: undefined },
      { skipAddToStore: true, skipCreateSession: true }
    );

    handleSessionStoreRequired(request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(SessionStoreNotConfiguredError));
  });

  test('Should not error if session store is configured.', async (context: SessionEnabledRequestContext) => {
    const { next, request, response } = createTestRequestSessionData(
      context,
      {},
      { skipAddToStore: true, skipCreateSession: true }
    );

    handleSessionStoreRequired(request, response, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('api.middleware.handleSessionStoreRequired', () => {
  test.skip('Should error on request when the session store is not configured.', async (context: ApiTestContext &
    MiddlewareHandlerTestContext &
    SessionTestContext &
    TaskContext) => {
    context.preSessionMiddleware = [handleSessionStoreRequired];
    setupSessionContext(context, { store: null as unknown as MemoryStore });
    createHandlerTestContext(context);
    context.startingUrl = '/';

    // const { app, memoryStore } = sessionlessAppWithMiddleware([handleSessionStoreRequired]);

    expect(context.sessionOptions.store).toBeNull();
    const st = setupSupertestContext(context);
    const response = await st;
    // const response = await supertest(app).get('/').set('Content-Type', 'application/json');

    expect(response.status).toBe(501);
  });

  test('Should accept a request when the session store is configured.', async (context: ApiTestContext &
    MiddlewareHandlerTestContext &
    SessionTestContext &
    TaskContext) => {
    context.preSessionMiddleware = [handleSessionStoreRequired];
    setupSessionContext(context, { saveUninitialized: true });
    createHandlerTestContext(context);
    context.startingUrl = '/';

    const testSessionId = undefined; // generateNewSessionId();
    expect(context.sessionOptions.store).not.toBeUndefined();
    // context.currentSessionId = testSessionId;
    const st = setupSupertestContext(context);

    const response = await st;

    expect(context.sessionOptions.name).not.toBeUndefined();
    expect(response.status).toBe(200);
    expect(response.request.cookies).not.toBeUndefined();
    expectResponseSetsSessionIdCookie(
      response,
      context.sessionOptions.name!,
      testSessionId,
      context.sessionOptions.secret as string
    );
  });
});
