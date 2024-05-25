import { assignUserIdToRequestSession, assignUserIdToSession } from "./sessionUser";
import { beforeEach, describe, expect, test, vi } from "vitest";
import expressSession, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SystemSessionDataType } from "./types";
import { getMockReqResp } from "./testUtils";

describe('assignUserIdToSession', () => {
  let testSessionStoreData: SystemSessionDataType;
  let testRequestData: MockRequest;
  let memoryStore: Store;
  
  beforeEach(() => {
    const cookie = new Cookie();
    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie,
    });

    testRequestData = {
      newSessionIdGenerated: false,
      sessionID: undefined,
      sessionStore: memoryStore,
    };

    testSessionStoreData = {
      cookie,
      email: "test-email",
      newId: undefined,
      userId: 'test-user-id',
    };
  });

  test('Should assign a new userId to the session if there is not already one set.', () => {
    const { req, next } = getMockReqResp({
      ...testRequestData,
      sessionID: 'test-session-id',
    });

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);
    
    expect(req.session).toBeDefined();
    req.session.userId = undefined;

    req.session.save = vi.fn();

    assignUserIdToSession(req.session, next);

    expect(req.session.userId).not.toBe(undefined);
    expect(req.session.save).toHaveBeenCalled();

    expect(() => assignUserIdToSession(req.session, next)).not.toThrowError();
  });

  test('Should throw an error if the session is not defined on request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    expect(() => assignUserIdToSession(req.session, next)).toThrowError(
      'Session is not defined when assigning userId to session.');
  });

  test('Should call next if the session is not defined on request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    try {
      assignUserIdToSession(req.session, next);
    } catch (e) {
      expect (e).toBeDefined();
    }

    expect(next).not.toHaveBeenCalled();
  });

  test('Should throw an error if the session has no id.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);

    expect(req.session).toBeDefined();

    expect(() => assignUserIdToSession(req.session, next)).toThrowError(
      'Session ID is not defined on session when assigning userId to session.');
  });

  test('Should not call next if the session id is not defined on request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);

    expect(req.session).toBeDefined();

    try {
      assignUserIdToSession(req.session, next);
    } catch (e) {
      expect (e).toBeDefined();
    }
    expect(next).not.toHaveBeenCalled();
  });
});

describe('assignUserIdToRequestSession', () => {
  let testSessionStoreData: SystemSessionDataType;
  let testRequestData: MockRequest;
  let memoryStore: Store;
  
  beforeEach(() => {
    const cookie = new Cookie();
    memoryStore = new expressSession.MemoryStore();
    memoryStore.set('some-session-id', {
      cookie,
    });

    testRequestData = {
      newSessionIdGenerated: false,
      sessionID: undefined,
      sessionStore: memoryStore,
    };

    testSessionStoreData = {
      cookie,
      email: "test-email",
      newId: undefined,
      userId: 'test-user-id',
    };
  });

  test('Should assign a new userId to the session if there is not already one set.', () => {
    const { req, next } = getMockReqResp({
      ...testRequestData,
      sessionID: 'test-session-id',
    });

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);
    
    expect(req.session).toBeDefined();
    req.session.userId = undefined;

    req.session.save = vi.fn();

    assignUserIdToRequestSession(req, next);

    expect(req.session.userId).not.toBe(undefined);
    expect(req.session.save).toHaveBeenCalled();

    expect(() => assignUserIdToRequestSession(req, next)).not.toThrowError();
  });

  test('Should throw an error if the session is not defined on request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    expect(() => assignUserIdToRequestSession(req, next)).toThrowError();
  });

  test('Should call next if the session is not defined on request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    try {
      assignUserIdToRequestSession(req, next);
    } catch (e) {
      expect (e).toBeDefined();
    }

    expect(next).not.toHaveBeenCalled();
  });

  test('Should throw an error if the session has no id.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);

    expect(req.session).toBeDefined();

    expect(() => assignUserIdToRequestSession(req, next)).toThrowError();
  });

  test('Should not call next if the session id is not defined on request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);

    expect(req.session).toBeDefined();

    try {
      assignUserIdToRequestSession(req, next);
    } catch (e) {
      expect (e).toBeDefined();
    }
    expect(next).not.toHaveBeenCalled();
  });

  test('Requires a session to be defined on the request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    expect(() => assignUserIdToRequestSession(req, next)).toThrowError();
  });

  test('Requires a session id to be defined on the request.', () => {
    const { req, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);

    expect(req.session).toBeDefined();

    expect(() => assignUserIdToRequestSession(req, next)).toThrowError();
  });

  test('Requires a session id on the session to be a string.', () => {
    const { req, next } = getMockReqResp(
      {
        ...testRequestData,
        sessionID: 12345 as unknown as string,
      });

    memoryStore.set('test-session-id', testSessionStoreData);
    req.sessionStore.createSession(req, testSessionStoreData);

    expect(req.session).toBeDefined();

    expect(() => assignUserIdToRequestSession(req, next)).toThrowError();
  });
});
