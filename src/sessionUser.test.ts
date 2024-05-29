import { addIgnoredLog, addIgnoredLogsFromFunction, clearIgnoredFunctions } from "./setup-tests";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { assignUserIdToRequestSession, assignUserIdToSession } from "./sessionUser";
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
    // eslint-disable-next-line
    addIgnoredLog(/Assigned a new userId ([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}) to session test-session-id/i);
    const { request, next } = getMockReqResp({
      ...testRequestData,
      sessionID: 'test-session-id',
    });

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);
    
    expect(request.session).toBeDefined();
    request.session.userId = undefined;

    request.session.save = vi.fn();

    assignUserIdToSession(request.session, next);

    expect(request.session.userId).not.toBe(undefined);
    expect(request.session.save).toHaveBeenCalled();

    expect(() => assignUserIdToSession(request.session, next)).not.toThrowError();
  });

  test('Should throw an error if the session is not defined on request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    expect(() => assignUserIdToSession(request.session, next)).toThrowError(
      'Session is not defined when assigning userId to session.');
  });

  test('Should call next if the session is not defined on request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    try {
      assignUserIdToSession(request.session, next);
    } catch (e) {
      expect (e).toBeDefined();
    }

    expect(next).not.toHaveBeenCalled();
  });

  test('Should throw an error if the session has no id.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);

    expect(request.session).toBeDefined();

    expect(() => assignUserIdToSession(request.session, next)).toThrowError(
      'Session ID is not defined on session when assigning userId to session.');
  });

  test('Should not call next if the session id is not defined on request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);

    expect(request.session).toBeDefined();

    try {
      assignUserIdToSession(request.session, next);
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

    addIgnoredLogsFromFunction(assignUserIdToSession);
  });

  afterEach(() => {
    clearIgnoredFunctions();
  });

  test('Should assign a new userId to the session if there is not already one set.', () => {
    const { request, next } = getMockReqResp({
      ...testRequestData,
      sessionID: 'test-session-id',
    });

    memoryStore.set('test-session-id', testSessionStoreData);
    addIgnoredLog(/^Assigned a new userId (.*) to session test-session-id$/);
    request.sessionStore.createSession(request, testSessionStoreData);
    
    expect(request.session).toBeDefined();
    request.session.userId = undefined;

    request.session.save = vi.fn();

    assignUserIdToRequestSession(request, next);

    expect(request.session.userId).not.toBe(undefined);
    expect(request.session.save).toHaveBeenCalled();

    expect(() => assignUserIdToRequestSession(request, next)).not.toThrowError();
  });

  test('Should throw an error if the session is not defined on request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    expect(() => assignUserIdToRequestSession(request, next)).toThrowError();
  });

  test('Should call next if the session is not defined on request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    try {
      assignUserIdToRequestSession(request, next);
    } catch (e) {
      expect (e).toBeDefined();
    }

    expect(next).not.toHaveBeenCalled();
  });

  test('Should throw an error if the session has no id.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);

    expect(request.session).toBeDefined();

    expect(() => assignUserIdToRequestSession(request, next)).toThrowError();
  });

  test('Should not call next if the session id is not defined on request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);

    expect(request.session).toBeDefined();

    try {
      assignUserIdToRequestSession(request, next);
    } catch (e) {
      expect (e).toBeDefined();
    }
    expect(next).not.toHaveBeenCalled();
  });

  test('Requires a session to be defined on the request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    expect(() => assignUserIdToRequestSession(request, next)).toThrowError();
  });

  test('Requires a session id to be defined on the request.', () => {
    const { request, next } = getMockReqResp(testRequestData);

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);

    expect(request.session).toBeDefined();

    expect(() => assignUserIdToRequestSession(request, next)).toThrowError();
  });

  test('Requires a session id on the session to be a string.', () => {
    const { request, next } = getMockReqResp(
      {
        ...testRequestData,
        sessionID: 12345 as unknown as string,
      });

    memoryStore.set('test-session-id', testSessionStoreData);
    request.sessionStore.createSession(request, testSessionStoreData);

    expect(request.session).toBeDefined();

    expect(() => assignUserIdToRequestSession(request, next)).toThrowError();
  });
});
