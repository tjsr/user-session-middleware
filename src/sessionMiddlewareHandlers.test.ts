import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createMockPromisePair, getMockResResp } from "./testUtils";
import express, * as Express from "express";
import expressSession, { Cookie, Session, Store } from "express-session";
import { getMockReq, getMockRes } from "vitest-mock-express";
import { handleSessionWithNewlyGeneratedId, requiresSessionId, retrieveSessionData } from "./sessionMiddlewareHandlers";

import { NextFunction } from "express";
import { SystemSessionDataType } from "./types";
import { addIgnoredLog } from "./setup-tests";
import session from 'express-session';
import { sessionHandlerMiddleware } from "./getSession";
import supertest from 'supertest';

describe('handleSessionWithNewlyGeneratedId', () => {
  let testSessionData: Session & Partial<SystemSessionDataType>;
  let memoryStore: Store;

  beforeEach(() => {
    testSessionData = {
      cookie: new Cookie(),
    }as Session & Partial<SystemSessionDataType>;

    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie: new Cookie(),
    });
  });

  test('Should save the session and continue on if there was no sessionID, but a new session was generated', () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: true,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    const { res, next } = getMockRes<Express.Response>();
    
    memoryStore.createSession(req, testSessionData);

    vi.spyOn(req.session, 'save');
    handleSessionWithNewlyGeneratedId(req, res, next);

    expect(req.session.save).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('Should call next without saving if a new session was not generated', () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: false,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    const { res, next } = getMockRes<Express.Response>();
    
    memoryStore.createSession(req, testSessionData);

    vi.spyOn(req.session, 'save');
    handleSessionWithNewlyGeneratedId(req, res, next);

    expect(req.session.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('Should call next without saving if a newSessionIdGenerated was undefined', () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: undefined,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    const { res, next } = getMockRes<Express.Response>();
    
    memoryStore.createSession(req, testSessionData);

    vi.spyOn(req.session, 'save');
    handleSessionWithNewlyGeneratedId(req, res, next);

    expect(req.session.save).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

describe('retrieveSessionData', () => {
  let testSessionData: Session & Partial<SystemSessionDataType>;
  let memoryStore: Store;

  beforeEach(() => {
    testSessionData = {
      cookie: new Cookie(),
    }as Session & Partial<SystemSessionDataType>;

    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie: new Cookie(),
    });
  });

  test('Should reject the session if a sessionID was provided but no session data was found', async () => {
    // eslint-disable-next-line max-len
    addIgnoredLog('SessionID received for nonexistent-session-id but no session data, with no new id generated. Ending session call.');
    const { req, res, next } = getMockResResp({
      newSessionIdGenerated: false,
      sessionID: 'nonexistent-session-id',
      sessionStore: memoryStore,
    });
    memoryStore.createSession(req, testSessionData);
    expect(req.session).toBeDefined();
    expect(req.sessionID).toBe('nonexistent-session-id');

    const [callbackPromiseEndHandler, callbackMockEndFunction]:
      [Promise<void>, typeof res.end] = createMockPromisePair(res.end);
    res.end = callbackMockEndFunction;

    const [callbackPromiseStatusHandler, callbackMockStatusFunction]:
      [Promise<void>, typeof res.status] = createMockPromisePair(res.status);
    res.status = callbackMockStatusFunction;

    const [_callbackPromiseSessionSave, callbackMockSessionSaveFunction]:
      [Promise<void>, typeof req.session.save] = createMockPromisePair(req.session.save);
    req.session.save = callbackMockSessionSaveFunction;

    retrieveSessionData(req, res, next);

    await callbackPromiseEndHandler;
    expect(callbackMockEndFunction).toHaveBeenCalled();
    await callbackPromiseStatusHandler;
    expect(callbackMockStatusFunction).toHaveBeenCalledWith(401);

    expect(req.session.save).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test(
    'Should accept with a sessionID and there is data in the store, and was provided but no session data was found',
    async () => {
      addIgnoredLog('SessionID received for nonexistent-session-id');
      testSessionData.userId = 'mutated-user-id';
      testSessionData.email = 'mutated-email';
      memoryStore.set('fake-session-id', testSessionData);
      const { req, res, next } = getMockResResp({
        newSessionIdGenerated: false,
        sessionID: 'fake-session-id',
        sessionStore: memoryStore,
      });
      memoryStore.createSession(req, testSessionData);
      expect(req.session).toBeDefined();
      expect(req.sessionID).toBe('fake-session-id');

      const [callbackPromiseSessionSave, callbackMockSessionSaveFunction]:
        [Promise<void>, typeof req.session.save] = createMockPromisePair(req.session.save);
      req.session.save = callbackMockSessionSaveFunction;

      retrieveSessionData(req, res, next);

      await callbackPromiseSessionSave;
      expect(callbackMockSessionSaveFunction).toHaveBeenCalled();
      expect(req.session.save).toHaveBeenCalled();
      expect(req.session.userId).toBe('mutated-user-id');
      expect(req.session.email).toBe('mutated-email');
      
      expect(next).toHaveBeenCalled();
    });
});

describe('requiresSessionId', () => {
  let testSessionData: Session & Partial<SystemSessionDataType>;
  let memoryStore: Store;
  
  beforeEach(() => {
    testSessionData = {
      cookie: new Cookie(),
    }as Session & Partial<SystemSessionDataType>;

    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie: new Cookie(),
    });
  });
  
  test('Should send a 401 if the sessionID is undefined', async () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: false,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    const { res, next } = getMockRes<Express.Response>();
    
    memoryStore.createSession(req, testSessionData);
    expect(req.session).toBeDefined();
    expect(req.sessionID).toBeUndefined();

    requiresSessionId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('Should call next if the sessionID is defined', () => {
    const { req, res, next } = getMockResResp({
      sessionID: 'some-session-id',
    });
    memoryStore.createSession(req, testSessionData);
    expect(req.sessionID).not.toBeUndefined();
    requiresSessionId(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('retrieveSessionData', () => {
  let app: express.Express;
  let memoryStore: session.MemoryStore;

  const appWithMiddleware = (
    ...middleware: express.RequestHandler[]
    // additionalRootAssertions?: (req: express.Request, res: express.Response, next: NextFunction) => void
  ) => {
    memoryStore = new session.MemoryStore();

    app = express();
    app.use(sessionHandlerMiddleware(memoryStore));
    // app.use(requiresSessionId, handleSessionWithNewlyGeneratedId, retrieveSessionData);
    // app.use(retrieveSessionData);
    app.use(middleware);
    app.get('/', (req, res, _next) => {
      res.status(200);
      res.end();
      // next();
    });
    app.use((err: Error, req: express.Request, res: express.Response, _next: NextFunction) => {
      if (err) {
        res.status(500);
      }
      if (!res.statusCode) {
        res.status(501);
      }
      res.end();
    });
  };

  beforeAll(async () => {
    return Promise.resolve();
  });

  afterAll(async () => {
    return Promise.resolve(); // closeConnectionPool();
  });

  test('Should reject a made-up SessionID that we dont know about', async () => {
    appWithMiddleware(retrieveSessionData);
    return new Promise<void>((done) => {
      supertest(app)
        .get('/')
        .set('x-session-id', 'abcd-1234')
        .set('Content-Type', 'application/json')
        .expect(401, () => {
          done();
        });
    });
  });

  test('Should accept a request with no sessionId', async () => {
    appWithMiddleware(retrieveSessionData);
    return new Promise<void>((done) => {
      supertest(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .end((err, res) => {
          expect(err).toBeNull();
          expect(res.status).toBe(200);
          done();
        });
    });
  });

  test('Should accept a request with a valid sessionId', async () => {
    appWithMiddleware(retrieveSessionData);

    return new Promise<void>((done) => {
      memoryStore.set('abcd-1234', {
        cookie: new Cookie(),
      });

      supertest(app)
        .get('/')
        .set('x-session-id', 'abcd-1234')
        .set('Content-Type', 'application/json')
        .expect(200, () => {
          done();
        });
    });
  });
});
