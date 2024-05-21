import * as Express from "express";

import { Mock, beforeEach, describe, expect, test, vi } from 'vitest';
import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";
import expressSession, { Cookie, Session, Store } from 'express-session';
import { getMockReq, getMockRes } from "vitest-mock-express";
import {
  handleSessionFromStore,
  saveSessionDataToSession as saveStoredSessionDataToSession
} from './simpleSessionId.js';
import {
  handleSessionWithNewlyGeneratedId,
  requiresSessionId,
  retrieveSessionData
} from './sessionMiddlewareHandlers.js';

import { MockRequest } from "vitest-mock-express/dist/src/request/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockPromisePair = (template: any): [Promise<void>, Mock] => {
  type CalledMethodType = typeof template;
  type Params = Parameters<CalledMethodType>; // The parameters of the method
  type Return = ReturnType<CalledMethodType>; // The return type of the method

  let resolver: (value: void | PromiseLike<void>) => void;
  const promise = new Promise<void>((resolve: (value: void | PromiseLike<void>) => void) => {
    resolver = resolve;
  });

  const mock:Mock = vi.fn<Params, Return>((...args: Params): Return => {
    if (resolver) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver(args as any);
    }
    return template as unknown as Return;
  });
  return [promise, mock];
};

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

const getMockResResp = (values?: MockRequest | undefined) => {
  // @ts-expect-error TS6311
  const { clearMockRes, next, res, _mockClear } = getMockRes<Express.Response>();
  const req = getMockReq<SystemHttpRequestType<SystemSessionDataType>>(values);
  const clearMockReq = () => {
    console.debug('TODO: Clearing request mock is not yet implemented.');
  };

  const clear = () => {
    clearMockReq();
    clearMockRes();
    // TODO: Clear response mocks
  };
  
  return { clearMockReq, clearMockRes, mockClear: clear, next, req, res };
};

describe('handleSessionFromStore', () => {
  test('Should return 401 if no sessionID is provided', () => {
    const { req, res, next } = getMockResResp();
    handleSessionFromStore(req, res, undefined, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe('saveSessionDataToSession', () => {
  let memoryStore: Store;
  let testSessionData: SystemSessionDataType;
  let req: SystemHttpRequestType<SystemSessionDataType>;

  const withTestSession = (
    partailStoreData: Partial<SystemSessionDataType>,
    existingSessionDataOverrides: Partial<SystemSessionDataType>,
    noSave = false
  ): Session & Partial<SystemSessionDataType> => {
    const storedSessionData: Partial<SystemSessionDataType> = {
      ...partailStoreData,
      cookie: new Cookie(),
    };
    testSessionData = {
      ...testSessionData,
      ...existingSessionDataOverrides,
    };

    const session: Session & Partial<SystemSessionDataType> = memoryStore.createSession(req, testSessionData);
    if (!noSave) {
      session.save = vi.fn();
    }
    saveStoredSessionDataToSession(storedSessionData as SystemSessionDataType, session);
    expect(session.save).toBeCalled();
    return session;
  };
  
  beforeEach(() => {
    testSessionData = {
      cookie: new Cookie(),
      email: 'existing-email',
      newId: undefined,
      userId: 'existing-user-id',
    };

    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie: new Cookie(),
    });

    req = getMockReq<SystemHttpRequestType<SystemSessionDataType>>({
      newSessionIdGenerated: false,
      sessionID: 'fake-session-id',
      sessionStore: memoryStore,
    });
  });

  test('Should take session data userId if no userId is already on session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      {
        email: 'test-user-email',
        userId: 'test-user-id',
      },
      { userId: undefined }
    );
    expect(sessionToVerify.userId).toBe('test-user-id');
  });

  test('Should take existing session data userId if userId is already on session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      {
        email: 'test-user-email',
        userId: 'test-user-id',
      },
      { userId: 'existing-user-id' }
    );
    expect(sessionToVerify.userId).toBe('existing-user-id');
  });

  test('Should take session data email if email is already on session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      { email: 'test-user-email' },
      { email: undefined }
    );
    expect(sessionToVerify.email).toBe('test-user-email');
  });

  test('Should take existing session data email if no email is already on session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      { email: 'test-user-emnail' },
      { email: 'existing-user-email' }
    );
    expect(sessionToVerify.email).toBe('existing-user-email');
  });

  test('Should take newId flag if not already on session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      { newId: true },
      { newId: undefined }
    );
    expect(sessionToVerify.newId).toBe(false);
  });

  test('Should not override newId flag if explicitly set to false session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      { newId: true },
      { newId: false }
    );
    expect(sessionToVerify.newId).toBe(false);
  });

  test('Should not override newId=true flag if explicitly set to false session', () => {
    const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
      { newId: false },
      { newId: true }
    );
    expect(sessionToVerify.newId).toBe(false);
  });

  test('Should take newId value from existing session', () => {
    [true, false].forEach((storedNewId) => {
      const sessionToVerify: Session & Partial<SystemSessionDataType> = withTestSession(
        { newId: storedNewId },
        { newId: undefined }
      );
      expect(sessionToVerify.newId).toBe(false);
    });
  });
});
