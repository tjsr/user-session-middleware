import { SESSION_ID_HEADER_KEY, sessionHandlerMiddleware } from "./getSession";
import { SystemHttpRequestType, SystemSessionDataType } from "./types";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createMockPromisePair, getMockReqResp } from "./testUtils";
import express, * as Express from "express";
import expressSession, { Cookie, Session, SessionData, Store } from "express-session";
import { getMockReq, getMockRes } from "vitest-mock-express";
import {
  handleSessionWithNewlyGeneratedId,
  requiresSessionId,
  retrieveSessionData,
  retrieveSessionDataFromStore
} from "./sessionMiddlewareHandlers";

import { NextFunction } from "express";
import { addIgnoredLog } from "./setup-tests";
import session from 'express-session';
import { setSessionCookie } from "./sessionUserHandler";
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

describe('retrieveSessionData with mocked async callbacks', () => {
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
    const { req, res, next } = getMockReqResp({
      newSessionIdGenerated: false,
      sessionID: 'nonexistent-session-id',
      sessionStore: memoryStore,
    });
    memoryStore.createSession(req, testSessionData);
    expect(req.session).toBeDefined();
    expect(req.sessionID).toBe('nonexistent-session-id');

    const [_callbackPromiseEndHandler, callbackMockEndFunction]:
      [Promise<void>, typeof res.end] = createMockPromisePair(res.end);
    res.end = callbackMockEndFunction;

    const [callbackPromiseStatusHandler, callbackMockStatusFunction]:
      [Promise<void>, typeof res.status] = createMockPromisePair(res.status);
    res.status = callbackMockStatusFunction;

    const [_callbackPromiseSessionSave, callbackMockSessionSaveFunction]:
      [Promise<void>, typeof req.session.save] = createMockPromisePair(req.session.save);
    req.session.save = callbackMockSessionSaveFunction;

    retrieveSessionData(req, res, next);

    await callbackPromiseStatusHandler;
    expect(callbackMockStatusFunction).toHaveBeenCalledWith(401);

    expect(req.session.save).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test(
    'Should accept with a sessionID and there is data in the store, and was provided but no session data was found',
    async () => {
      addIgnoredLog('SessionID received for nonexistent-session-id');
      testSessionData.userId = 'mutated-user-id';
      testSessionData.email = 'mutated-email';
      memoryStore.set('fake-session-id', testSessionData);
      const { req, res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>({
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
    const req = getMockReq<SystemHttpRequestType<SystemSessionDataType>>({
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
    const { req, res, next } = getMockReqResp({
      sessionID: 'some-session-id',
    });
    memoryStore.createSession(req, testSessionData);
    expect(req.sessionID).not.toBeUndefined();
    requiresSessionId(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('retrieveSessionData supertest tests', () => {
  let app: express.Express;
  let memoryStore: session.MemoryStore;

  const appWithMiddleware = (
    ...middleware: (express.RequestHandler|express.ErrorRequestHandler)[]
    // additionalRootAssertions?: (req: express.Request, res: express.Response, next: NextFunction) => void
  ) => {
    memoryStore = new session.MemoryStore();

    app = express();
    app.use(sessionHandlerMiddleware(memoryStore));
    // app.use(requiresSessionId, handleSessionWithNewlyGeneratedId, retrieveSessionData);
    // app.use(retrieveSessionData);
    app.use(middleware);
    app.get('/', (req, res, next) => {
      res.status(200);
      res.end();
      next();
    });
    app.use((err: Error, req: express.Request, res: express.Response, _next: NextFunction) => {
      if (err && res.statusCode <= 300) {
        res.status(500);
      }
      if (!res.statusCode) {
        res.status(501);
      }
      console.trace('Reached error handler in test case.');
      res.send();
      // res.end();
      // next();
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
        .set(SESSION_ID_HEADER_KEY, 'abcd-1234')
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
        .set(SESSION_ID_HEADER_KEY, 'abcd-1234')
        .set('Content-Type', 'application/json')
        .expect(200, () => {
          done();
        });
    });
  });

  test(
    'Should generate a new session ID if the current session ID given is invalid and set the new value as a cookie.',
    async () => {
      // const regeneratedSessionId = 'regenerated-session-id';
      appWithMiddleware(retrieveSessionData, setSessionCookie);
      return new Promise<void>((done) => {
        supertest(app)
          .get('/')
          .set(SESSION_ID_HEADER_KEY, 'abcd-1234')
          .set('Content-Type', 'application/json')
          .end((err, res) => {
            expect(err).toBeNull();
            expect(res.status).toBe(401);
            // expect(res.headers['x-session-id']).toEqual(regeneratedSessionId);
            const cookieValue = res.get('Set-Cookie')[0];
            expect(cookieValue).not.toMatch(/sessionId=abcd-1234/);
            expect(cookieValue).toMatch(/sessionId=/);
            // expect(res.cookie).toHaveBeenCalledWith('sessionId', regeneratedSessionId);
            
            done();
          // })
          // .expect(401, () => {
          //   done();
          });
      });
    });
});

describe('retrieveSessionDataFromStore', () => {
  test ('Should reject when no session ID is passed to function', async () => {
    const memoryStore = new session.MemoryStore();
    let result: SystemSessionDataType | undefined | null = undefined;
    try {
      result = await retrieveSessionDataFromStore(memoryStore, undefined!);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.message).toEqual('No session ID received');
    }
    expect(result).toBeUndefined();
  });

  test ('Throw a generic error as a rejected promise when a load failure occurs.', async () => {
    const memoryStore = new session.MemoryStore();
    const testError: Error = new Error('Generic session storage error occurred.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memoryStore.get = vi.fn((sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
      callback(testError, undefined);
    }) as never;

    expect(retrieveSessionDataFromStore(memoryStore, 'some-session-id'))
      .rejects.toThrowError('Generic session storage error occurred.');
  });

  test ('Should return some session data.', async () => {
    const memoryStore = new session.MemoryStore();
    const testSessionId = 'test-session-id';
    memoryStore.set(testSessionId,
      {
        email: 'test-email',
        userId: 'test-user-id',
      } as SystemSessionDataType);

    expect(retrieveSessionDataFromStore(memoryStore, 'test-session-id'))
      .resolves.not.toThrow();

    const storeData: SystemSessionDataType |undefined | null = await retrieveSessionDataFromStore(
      memoryStore, 'test-session-id');
    expect(storeData).not.toBeUndefined();
    expect(storeData!.email).toEqual('test-email');
    expect(storeData!.userId).toEqual('test-user-id');
    expect(storeData!.newId).toBeUndefined();
  });
});
