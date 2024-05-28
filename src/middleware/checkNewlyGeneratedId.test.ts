import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";
import { beforeEach, describe, expect, test } from "vitest";
import expressSession, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SessionHandlerError } from "../errors.js";
import { checkNewlyGeneratedId } from "./handleSessionId.js";
import { getMockReqResp } from "../testUtils.js";

describe('checkNewlyGeneratedId', () => {
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
  
  test('Should throw error if sessionID on request is not set for newly generated id', () => {
    const { request: req, response: _res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        newSessionIdGenerated: true,
        sessionID: undefined,
      }
    );

    testRequestData.new = true;
    req.sessionStore.createSession(req, testSessionStoreData);
    
    const returnValue = checkNewlyGeneratedId(req, next);
    expect(returnValue).toEqual(true);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
  });

  test('Should skip to next handler if sessionID is set and is a newly generated id', () => {
    const { request: req, response: _res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        newSessionIdGenerated: true,
        sessionID: 'session-1234',
      }
    );
    testRequestData.new = true;
    req.sessionStore.createSession(req, testSessionStoreData);
    
    const returnValue = checkNewlyGeneratedId(req, next);
    expect(returnValue).toEqual(true);
    expect(next).toHaveBeenCalledWith();
  });

  test('Should not skip to error handler or next if sessionID is not set but this is not a newly generated id', () => {
    const { request: req, response: _res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        newSessionIdGenerated: false,
        sessionID: 'session-1234',
      }
    );
    testRequestData.new = true;
    req.sessionStore.createSession(req, testSessionStoreData);
    
    const returnValue = checkNewlyGeneratedId(req, next);
    expect(returnValue).toEqual(false);
    expect(next).not.toHaveBeenCalled();
  });
});
