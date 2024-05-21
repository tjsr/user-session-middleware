import * as Express from "express";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createMockPromisePair, getMockResResp } from "./testUtils";
import expressSession, { Cookie, Session, Store } from "express-session";
import { getMockReq, getMockRes } from "vitest-mock-express";
import { handleSessionWithNewlyGeneratedId, requiresSessionId, retrieveSessionData } from "./sessionMiddlewareHandlers";

import { SystemSessionDataType } from "./types";

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
});

describe('retrieveSessionData', () => {
  let testSessionData: Session & Partial<SystemSessionDataType>;
  let memoryStore: Store;
  let tmpStdErr: typeof console.error;

  beforeEach(() => {
    testSessionData = {
      cookie: new Cookie(),
    }as Session & Partial<SystemSessionDataType>;

    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie: new Cookie(),
    });

    tmpStdErr = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = tmpStdErr;
  });

  test('Should reject the session if a sessionID was provided but no session data was found', async () => {
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

    requiresSessionId(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
