import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";
import { addIgnoredLogsFromFunction, clearIgnoredFunctions } from "./setup-tests.js";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import expressSession, { Cookie, Session, Store } from 'express-session';

import { assignUserIdToRequestSession } from "./sessionUser.js";
import { getMockReq } from "vitest-mock-express";
import { saveSessionDataToSession } from './store/loadData.js';

describe('handleSessionFromStore', () => {
  beforeAll(() => {
    addIgnoredLogsFromFunction(assignUserIdToRequestSession);
  });

  afterAll(() => {
    clearIgnoredFunctions();
  });

  // test('Should return 401 if no sessionID is provided', () => {
  //   const { req, res, next } = getMockReqResp();
  //   addIgnoredLog('No session ID received - can\'t process retrieved session.');
  //   handleSessionFromStore(req, res, undefined, next);
  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.end).toHaveBeenCalled();
  //   expect(next).not.toHaveBeenCalled();
  // });

  // test('Should return a 401 when a newly generated sessionID results in retrieving exising data.', () => {
  //   addIgnoredLog(/New session ID generated but session data already exists - this should never happen./i);
  //   const testSessionId = 'some-session-id';
  //   const memoryStore = new expressSession.MemoryStore();

  //   const testSessionData: SystemSessionDataType = {
  //     cookie: new Cookie(),
  //     email: 'test-email',
  //     newId: undefined,
  //     userId: 'test-user-id',
  //   };

  //   memoryStore.set(testSessionId, testSessionData);

  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: true,
  //     sessionID: testSessionId,
  //     sessionStore: memoryStore,
  //   });

  //   memoryStore.createSession(req, testSessionData);

  //   handleSessionFromStore(req, res, testSessionData, next);

  //   expect(res.status).toBeCalledWith(401);
  //   expect(res.end).toBeCalled();
  //   expect(next).not.toBeCalled();
  // });

  // test('Should fail when handling a session from the store with no sessionId.', () => {
  //   const memoryStore = new expressSession.MemoryStore();

  //   const testSessionData: SystemSessionDataType = {
  //     cookie: new Cookie(),
  //     email: 'test-email',
  //     newId: undefined,
  //     userId: 'test-user-id',
  //   };

  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: true,
  //     sessionID: undefined,
  //     sessionStore: memoryStore,
  //   });

  //   memoryStore.createSession(req, testSessionData);

  //   handleSessionFromStore(req, res, testSessionData, next);

  //   expect(res.status).toBeCalledWith(500);
  //   expect(res.end).toBeCalled();
  //   expect(next).not.toBeCalled();
  // });

  // test('Should save when a new sessionID is generated.', () => {
  //   const testSessionId = 'some-session-id';
  //   const memoryStore = new expressSession.MemoryStore();

  //   const testSessionData: SystemSessionDataType = {
  //     cookie: new Cookie(),
  //     email: 'test-email',
  //     newId: undefined,
  //     userId: 'test-user-id',
  //   };

  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: true,
  //     sessionID: testSessionId,
  //     sessionStore: memoryStore,
  //   });

  //   memoryStore.createSession(req, testSessionData);
  //   expect(req.session).not.toBeUndefined();
  //   req.session.save = vi.fn();

  //   handleSessionFromStore(req, res, undefined, next);

  //   expect(req.session.save).toBeCalled();
  //   expect(next).toBeCalled();
  // });
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
    // TODO: Fix this
    saveSessionDataToSession(storedSessionData as SystemSessionDataType, session);
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
