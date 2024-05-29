import { MockReqRespSet, getMockReqResp } from "../testUtils";
import { SystemHttpRequestType, SystemSessionDataType } from "../types";
import { beforeEach, describe, expect, test, vi } from "vitest";
import expressSession, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SessionHandlerError } from "../errors";
import { handleSessionWithNewlyGeneratedId } from "./handleSessionId";

describe('handleSessionWithNewlyGeneratedId', () => {
  let testSessionStoreData: SystemSessionDataType;
  let testRequestData: MockRequest;
  let memoryStore: Store;

  const createTestData = (
    mockDataOverrides?: MockRequest | undefined, skipCreateSession = false
  ): {  } & MockReqRespSet => {
    const mocks = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
      {
        ...testRequestData,
        ...mockDataOverrides,
        sessionID: 'session-2345',
      }
    );
    const { request } = mocks;
    testRequestData.new = true;
    if (!skipCreateSession) {
      request.sessionStore.createSession(request, testSessionStoreData);
      request.session.save = vi.fn();
    }

    return { ...mocks };
  };

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

  test('Should call save when a session is newly generated.', () => {
    const { next, request, response } = createTestData({
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    });

    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith();
    expect(request.session.save).toHaveBeenCalled();
  });

  test('Should not save when a session is pre-existing.', () => {
    const { next, request, response } = createTestData();
    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith();
    expect(request.session.save).not.toHaveBeenCalled();
  });

  test('Should call to error handler and not call save if session was not initialized.', () => {
    const { next, request, response } = createTestData({
      sessionID: 'session-2345',
    }, true);

    testRequestData.new = true;
    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
    expect(request.session).toBeUndefined();
    
  });
});
