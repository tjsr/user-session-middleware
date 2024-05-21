import * as Express from "express";

import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";
import { beforeEach, describe, expect, test, vi } from 'vitest';
import expressSession, { Cookie, Session, SessionData, Store } from 'express-session';
import { getMockReq, getMockRes } from "vitest-mock-express";
import { saveSessionDataToSession as saveStoredSessionDataToSession, simpleSessionId } from './simpleSessionId.js';

describe('simpleSessionId', () => {
  let testSessionData: SessionData;
  let memoryStore: Store;
  
  beforeEach(() => {
    testSessionData = {
      cookie: new Cookie(),
    };

    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie: new Cookie(),
    });
  });

  test('Should send a 401 if the sessionID is not found', async () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: false,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    const { res, next } = getMockRes<Express.Response>();
    memoryStore.createSession(req, testSessionData);
    expect(req.session).toBeDefined();
    expect(req.sessionID).toBeUndefined();

    simpleSessionId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('Should save the session and continue on if there was no sessionID, but a new session was generated', () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: true,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    const { res, next } = getMockRes<Express.Response>();
    
    memoryStore.createSession(req, testSessionData);

    simpleSessionId(req, res, next);
    vi.spyOn(req.session, 'save');

    simpleSessionId(req, res, next);
    expect(req.session.save).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('Should reject the session a sessionID was provided but no session data was found', () => {
    const handleSessionFromStoreMock = vi.fn();
    const { res, next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: false,
      sessionID: 'fake-session-id',
      sessionStore: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get: (sid: string, callback: (err: any, session?: SessionData | null) => {
            handleSessionFromStoreMock(req, res, testSessionData, next);
          }) => {
          callback(null, null);
          return;
        },
      },
    });
    memoryStore.createSession(req, testSessionData);
    expect(req.session).toBeDefined();
    expect(req.sessionID).toBe('fake-session-id');

    simpleSessionId(req, res, next, handleSessionFromStoreMock);

    expect(handleSessionFromStoreMock).toHaveBeenCalled();
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
