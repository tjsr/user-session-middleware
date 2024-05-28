import { SystemHttpRequestType, SystemSessionDataType } from "../types";
import { beforeEach, describe, expect, test, vi } from "vitest";
import expressSession, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SessionHandlerError } from "../errors";
import { getMockReqResp } from "../testUtils";
import { handleSessionWithNewlyGeneratedId } from "./handleSessionId";

describe('handleSessionWithNewlyGeneratedId', () => {
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

  // test('Should call save when no sessionID is provided.', () => {
  test('Should call save when a session is newly generated.', () => {
    const { request: req, response: res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        newSessionIdGenerated: true,
        sessionID: 'session-1234',
      }
    );
    testRequestData.new = true;
    req.sessionStore.createSession(req, testSessionStoreData);
    req.session.save = vi.fn();
    handleSessionWithNewlyGeneratedId(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.session.save).toHaveBeenCalled();
  });

  test('Should not save when a session is pre-existing.', () => {
    const { request: req, response: res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        sessionID: 'session-2345',
      }
    );
    testRequestData.new = true;
    req.sessionStore.createSession(req, testSessionStoreData);
    req.session.save = vi.fn();
    handleSessionWithNewlyGeneratedId(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.session.save).not.toHaveBeenCalled();
  });

  test('Should call to error handler and not call save if session was not initialized.', () => {
    const { request: req, response: res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        sessionID: 'session-2345',
      }
    );
    testRequestData.new = true;
    handleSessionWithNewlyGeneratedId(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
    expect(req.session).toBeUndefined();
  });
});
