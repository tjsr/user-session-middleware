import { SystemHttpRequestType, SystemSessionDataType } from "./types";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { Cookie } from "express-session";
import { NextFunction } from "express";
import { SESSION_ID_HEADER_KEY } from "./getSession";
import { addIgnoredLog } from "./setup-tests";
import { appWithMiddleware } from "./testUtils";
import { assignUserIdToRequestSessionHandler } from "./sessionUserHandler";
import supertest from 'supertest';

describe('assignUserIdToRequestSessionHandler', () => {
  beforeAll(async () => {
    return Promise.resolve();
  });

  afterAll(async () => {
    return Promise.resolve(); // closeConnectionPool();
  });

  test('Should set and save the userId on the request session when userId ' + 
    ' is not yet set and no existing session data in store.', async () => {
    const endValidator = (
      req: SystemHttpRequestType<SystemSessionDataType>,
      _res: Express.Response,
      next: NextFunction
    ) => {
      expect(req.session.userId).not.toBeUndefined();
      next();
    };
    const { app } = appWithMiddleware(assignUserIdToRequestSessionHandler, endValidator);
    const testSessionId = 'test-session-4321';
    addIgnoredLog(/^Assigned a new userId (.*) to session test-session-4321$/);

    return new Promise<void>((done) => {
      supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(200, () => {
          done();
        });
    });
  });

  test('Should set and save the userId on the request session when data in store has no userId.', async () => {
    const endValidator = (
      req: SystemHttpRequestType<SystemSessionDataType>,
      _res: Express.Response,
      next: NextFunction
    ) => {
      expect(req.session.userId).not.toBeUndefined();
      next();
    };
    const { app, memoryStore } = appWithMiddleware(assignUserIdToRequestSessionHandler, endValidator);
    const testSessionData: SystemSessionDataType = {
      // TODO: Stored data doesn't need to store cookie.
      cookie: new Cookie(),
      email: 'test-email',
      newId: false,
      userId: undefined!,
    };
    const testSessionId = 'test-session-4321';
    addIgnoredLog(/^Assigned a new userId (.*) to session test-session-4321$/);
    memoryStore.set(testSessionId, testSessionData);

    return new Promise<void>((done) => {
      supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(200, () => {
          done();
        });
    });
  });

  test('Should set and save the userId on the session when no userId set but data in store has a userId.', async () => {
    const endValidator = (
      req: SystemHttpRequestType<SystemSessionDataType>,
      _res: Express.Response,
      next: NextFunction
    ) => {
      expect(req.session.userId).toEqual('test-user-id');
      next();
    };
    const testSessionId = 'test-session-4321';
    addIgnoredLog(/^Assigned a new userId (.*) to session test-session-4321$/);

    const { app, memoryStore } = appWithMiddleware(assignUserIdToRequestSessionHandler, endValidator);
    const testSessionData: SystemSessionDataType = {
      // TODO: Stored data doesn't need to store cookie.
      cookie: new Cookie(),
      email: 'test-email',
      newId: false,
      userId: 'test-user-id',
    };
    memoryStore.set(testSessionId, testSessionData);

    return new Promise<void>((done) => {
      supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testSessionId)
        .set('Content-Type', 'application/json')
        .expect(200, () => {
          done();
        });
    });
  });
});
