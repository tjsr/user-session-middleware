import { disableHandlerAssertions, forceHandlerAssertions } from './middleware/index.js';
import express, { NextFunction } from './express/index.js';
import {
  handleCopySessionStoreDataToSession,
  handleExistingSessionWithNoSessionData,
  handleSessionDataRetrieval,
} from './middleware/handlers/index.js';

import { SESSION_ID_COOKIE } from './getSession.js';
import { SystemHttpRequestType } from './types/request.js';
import { UserIdTaskContext } from './api/utils/testcontext.js';
import { UserSessionData } from './types/session.js';
import { appWithMiddleware } from './utils/testing/middlewareTestUtils.js';
import { generateSessionIdForTest } from './utils/testIdUtils.js';
import { mockSession } from './utils/testing/mocks.js';
import { setSessionCookie } from '@tjsr/testutils';
import { setUserIdNamespaceForTest } from './utils/testing/testNamespaceUtils.js';
import supertest from 'supertest';

describe<UserIdTaskContext>('assignUserIdToRequestSessionHandler', () => {
  beforeAll(async () => {
    forceHandlerAssertions(false);
    disableHandlerAssertions(true);
    return Promise.resolve();
  });

  beforeEach(async (context: UserIdTaskContext) => {
    setUserIdNamespaceForTest(context);
  });

  afterAll(async () => {
    forceHandlerAssertions(false);
    disableHandlerAssertions(false);
    return Promise.resolve(); // closeConnectionPool();
  });

  test('Should set/save userId on req.session when userId is not yet set and no existing session data in store.', async (context: UserIdTaskContext) => {
    const endValidator = (req: SystemHttpRequestType, _res: express.Response, next: NextFunction) => {
      expect(req.session.userId).not.toBeUndefined();
      next();
    };
    const { app } = appWithMiddleware(
      [handleCopySessionStoreDataToSession, handleExistingSessionWithNoSessionData],
      [endValidator]
    );

    const testSessionId = generateSessionIdForTest(context);
    const testSecret = 'test-secret';
    let st = supertest(app).get('/').set('Content-Type', 'application/json');
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, testSecret).expect(401);
    const response = await st;

    expect(response.statusCode).toEqual(401);
  });

  test('Should set and save the userId on the request session when data in store has no userId.', async (context: UserIdTaskContext) => {
    const endValidator = (req: SystemHttpRequestType, _res: express.Response, next: NextFunction) => {
      expect(req.session.userId).not.toBeUndefined();
      next();
    };
    const { app, memoryStore } = appWithMiddleware(
      [handleSessionDataRetrieval, handleCopySessionStoreDataToSession],
      [endValidator]
    );
    const testSessionData: UserSessionData = mockSession(context.userIdNamespace);
    const testSessionId = generateSessionIdForTest(context);
    memoryStore.set(testSessionId, testSessionData);

    const response = await supertest(app).get('/').set('Content-Type', 'application/json').expect(200);
    expect(response.statusCode).toEqual(200);
  });

  test('Should set and save the userId on the session when no userId set but data in store has a userId.', async (context: UserIdTaskContext) => {
    const testSessionData: UserSessionData = mockSession(context.userIdNamespace);
    const testUserId = testSessionData.userId;
    const endValidator = (req: SystemHttpRequestType, response: express.Response, next: NextFunction) => {
      if (req.session.userId !== testUserId) {
        // TODO: Use exception
        response.status(500);
        next(new Error(`userId not set correctly: ${req.session.userId} != '${testUserId}'`));
      } else {
        next();
      }
    };
    const testSessionId = generateSessionIdForTest(context);

    // handleCopySessionStoreDataToSession must be called first and is responsible for assigment
    // of the data from the store to session
    const { app, memoryStore } = appWithMiddleware(
      [handleSessionDataRetrieval, handleCopySessionStoreDataToSession],
      [endValidator]
    );
    memoryStore.set(testSessionId, testSessionData);

    const testSecret = 'test-secret';
    let st = supertest(app).get('/').set('Content-Type', 'application/json');
    st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, testSecret).expect(200);
    const response = await st;
    expect(response).toEqual(200);
  });
});
