import * as Express from "express";

import { beforeEach, describe, expect, test, vi } from 'vitest';
import expressSession, { Session, Store } from 'express-session';
import { getMockReq, getMockRes } from "vitest-mock-express";

import { simpleSessionId } from './simpleSessionId.js';

describe('simpleSessionId', () => {
  const { res, mockClear, next } = getMockRes<Express.Response>();
  let mockSession: Session;
  beforeEach(() => {
    mockClear();
    const mockSession = vi.doMock(expressSession.Session);
    mockSession.save = vi.fn();

    // session = vite.mock();
    // session = vite.mockClass<Session>();
  });


  const memoryStore: Store = new expressSession.MemoryStore();
  // const testSessionId = createRandomId();
  // memoryStore.set(testSessionId, {
  //   cookie: new session.Cookie(),
  //   userId: testUserId,
  // } as TagtoolSessionData);


  test('Should send a 401 if the sessionID is not found', async () => {
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: false,
      sessionID: undefined,
      sessionStore: memoryStore,
    });
    // req.session = memoryStore;
    // const next = vite.mockFunction();
    // res.

    simpleSessionId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.end).toHaveBeenCalled();
  });

  test('Should save the session and continue on if there was no sessionID, but a new session was generated', () => {    
    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: true,
      session: mockSession,
      sessionID: undefined,
      sessionStore: memoryStore,
    });

    simpleSessionId(req, res, next);
    expect(mockSession.save).toHaveBeenCalled();
  });
});
