import { TaskContext, afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { disableHandlerAssertions, forceHandlerAssertions } from "./middleware/handlerChainLog.js";
import express, { NextFunction } from "express";
import {
  handleCopySessionStoreDataToSession,
  handleSessionDataRetrieval
} from './middleware/storedSessionData.js';

import { SESSION_ID_HEADER_KEY } from "./getSession.js";
import { SystemHttpRequestType } from "./types/request.js";
import { UserSessionData } from "./types/session.js";
import { appWithMiddleware } from './utils/testing/middlewareTestUtils.js';
import { generateSessionIdForTest } from "./utils/testIdUtils.js";
import { handleExistingSessionWithNoSessionData } from './middleware/handlers/handleExistingSessionWithNoSessionData.js';
import { mockSession } from "./utils/testing/mocks.js";
import { setUserIdNamespaceForTest } from "./utils/testNamespaceUtils.js";
import supertest from 'supertest';

describe('assignUserIdToRequestSessionHandler', () => {
  beforeAll(async () => {
    forceHandlerAssertions(false);
    disableHandlerAssertions(true);
    return Promise.resolve();
  });

  beforeEach(async (context: TaskContext) => {
    setUserIdNamespaceForTest(context);
  });

  afterAll(async () => {
    forceHandlerAssertions(false);
    disableHandlerAssertions(false);
    return Promise.resolve(); // closeConnectionPool();
  });

  test(
    'Should set/save userId on req.session when userId is not yet set and no existing session data in store.',
    async (context: TaskContext) => {
      const endValidator = (
        req: SystemHttpRequestType,
        _res: express.Response,
        next: NextFunction
      ) => {
        expect(req.session.userId).not.toBeUndefined();
        next();
      };
      const { app } = appWithMiddleware([
        handleCopySessionStoreDataToSession,
        handleExistingSessionWithNoSessionData,
      ], [endValidator]);
      const testSessionId = generateSessionIdForTest(context);

      // return new Promise<void>((done) => {
      const response = await supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(401);

      expect(response.statusCode).toEqual(401);
    });

  test('Should set and save the userId on the request session when data in store has no userId.',
    async (context: TaskContext) => {
      const endValidator = (
        req: SystemHttpRequestType,
        _res: express.Response,
        next: NextFunction
      ) => {
        expect(req.session.userId).not.toBeUndefined();
        next();
      };
      const { app, memoryStore } = appWithMiddleware([
        handleSessionDataRetrieval,
        handleCopySessionStoreDataToSession,
      ],
      [endValidator]);
      const testSessionData: UserSessionData = mockSession();
      const testSessionId = generateSessionIdForTest(context);
      memoryStore.set(testSessionId, testSessionData);

      const response = await supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(200);
      expect(response.statusCode).toEqual(200);
    });

  test(
    'Should set and save the userId on the session when no userId set but data in store has a userId.',
    async (context: TaskContext) => {
      const testSessionData: UserSessionData = mockSession();
      const testUserId = testSessionData.userId;
      const endValidator = (
        req: SystemHttpRequestType,
        response: express.Response,
        next: NextFunction
      ) => {
        if (req.session.userId !== testUserId) {
          response.status(500);
          next(new Error(`userId not set correctly: ${req.session.userId} != '${testUserId}'`));
        } else {
          next();
        }
      };
      const testSessionId = generateSessionIdForTest(context);

      // handleCopySessionStoreDataToSession must be called first and is responsible for assigment
      // of the data from the store to session
      const { app, memoryStore } = appWithMiddleware([
        handleSessionDataRetrieval,
        handleCopySessionStoreDataToSession,
      ], [endValidator]);
      memoryStore.set(testSessionId, testSessionData);

      return supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(200);
    });
});
