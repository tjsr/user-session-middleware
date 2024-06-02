import { SystemHttpRequestType, SystemSessionDataType } from "./types";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { disableHandlerAssertions, forceHandlerAssertions } from "./middleware/handlerChainLog.js";
import express, { NextFunction } from "express";
import {
  handleCopySessionStoreDataToSession,
  handleSessionDataRetrieval
} from './middleware/storedSessionData.js';

import { Cookie } from "express-session";
import { SESSION_ID_HEADER_KEY } from "./getSession";
import { addIgnoredLog } from "./setup-tests";
import { appWithMiddleware } from "./testUtils";
import {
  handleExistingSessionWithNoSessionData,
} from "./middleware/handleSessionWithNoData.js";
import supertest from 'supertest';

describe('assignUserIdToRequestSessionHandler', () => {
  beforeAll(async () => {
    forceHandlerAssertions(false);
    disableHandlerAssertions(true);
    return Promise.resolve();
  });

  afterAll(async () => {
    forceHandlerAssertions(false);
    disableHandlerAssertions(false);
    return Promise.resolve(); // closeConnectionPool();
  });

  test(
    'Should set/save userId on req.session when userId is not yet set and no existing session data in store.',
    async () => {
      const endValidator = (
        req: SystemHttpRequestType<SystemSessionDataType>,
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
      const testSessionId = 'test-session-4321';
      addIgnoredLog(/^Assigned a new userId (.*) to session test-session-4321$/);

      // return new Promise<void>((done) => {
      const response = await supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(401);

      expect(response.statusCode).toEqual(401);
    });

  test('Should set and save the userId on the request session when data in store has no userId.', async () => {
    const endValidator = (
      req: SystemHttpRequestType<SystemSessionDataType>,
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
    const testSessionData: SystemSessionDataType = {
      // TODO: Stored data doesn't need to store cookie.
      cookie: new Cookie(),
      email: 'test-email',
      newId: false,
      userId: 'some-user-id'!,
    };
    const testSessionId = 'test-session-4321';
    addIgnoredLog(/^Assigned a new userId (.*) to session test-session-4321$/);
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
    async () => {
      const endValidator = (
        req: SystemHttpRequestType<SystemSessionDataType>,
        _response: express.Response,
        next: NextFunction
      ) => {
        if (req.session.userId !== 'test-user-id') {
          next(new Error(`userId not set correctly: ${req.session.userId} != 'test-user-id'`));
        } else {
          next();
        }
      };
      const testSessionId = 'test-session-4321';
      addIgnoredLog(/^Assigned a new userId (.*) to session test-session-4321$/);

      // handleCopySessionStoreDataToSession must be called first and is responsible for assigment
      // of the data from the store to session
      const { app, memoryStore } = appWithMiddleware([
        handleSessionDataRetrieval,
        handleCopySessionStoreDataToSession,
      ], [endValidator]);
      const testSessionData: SystemSessionDataType = {
        // TODO: Stored data doesn't need to store cookie.
        cookie: new Cookie(),
        email: 'test-email',
        newId: false,
        userId: 'test-user-id',
      };
      memoryStore.set(testSessionId, testSessionData);

      return supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(200);
    });
});
