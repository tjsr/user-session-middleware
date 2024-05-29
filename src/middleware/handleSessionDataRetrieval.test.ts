import { SessionDataTestContext, createContextForSessionTest, createTestRequestSessionData } from "../testUtils.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SessionData } from "express-session";
import { SessionHandlerError } from "../errors.js";
import { handleSessionDataRetrieval } from './storedSessionData.js';

describe('handleSessionDataRetrieval', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));
  
  test('Should error when newly generated session has no sessionID.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: undefined,
    }, {});

    // should not call store.get
    request.sessionStore.get = vi.fn();

    handleSessionDataRetrieval(request, response, next);
    // should not call store.get
    expect(request.sessionStore.get).not.toBeCalled();
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
  });

  test('Should call next hanlder function for a newly generated session.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    }, {});

    // should not call store.get
    request.sessionStore.get = vi.fn();

    handleSessionDataRetrieval(request, response, next);
    // should not call store.get
    expect(request.sessionStore.get).not.toBeCalled();
    expect(next).toHaveBeenCalledWith();
    expect(request.retrievedSessionData).toBeUndefined();
  });

  test('Should call next handler function for existing id that returns no data.', async (context) => {
    const testSessionId = 'session-5432';
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: false,
      sessionID: testSessionId,
    }, {});
    context.memoryStore?.set(testSessionId, context.testSessionStoreData);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.memoryStore!.get = vi.fn((sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
      callback(undefined, undefined);
    }) as never;

    await handleSessionDataRetrieval(request, response, next);
    expect(context.memoryStore!.get).toBeCalled();
    expect(next).toBeCalled();
    expect(next).toHaveBeenCalledWith();
    expect(request.retrievedSessionData).toBeUndefined();
  });

  test('Should not call next when an error occurs for an existing id.', async (context) => {
    const testSessionId = 'session-5432';
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: false,
      sessionID: testSessionId,
    }, {});

    const testError: Error = new Error('Generic session storage error occurred.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.memoryStore!.get = vi.fn((sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
      callback(testError, undefined);
    }) as never;

    await handleSessionDataRetrieval(request, response, next);
    expect(context.memoryStore!.get).toBeCalled();
    expect(next).toBeCalledWith(expect.any(SessionHandlerError));
    expect(request.retrievedSessionData).toBeUndefined();
  });

  test('Should call next hanlder function for existing id that has data.', async (context) => {
    const testSessionId = 'session-6543';
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: false,
      sessionID: testSessionId,
    }, {});

    context.memoryStore?.set(testSessionId, context.testSessionStoreData);

    await handleSessionDataRetrieval(request, response, next);
    expect(next).toHaveBeenCalledWith();
    expect(request.retrievedSessionData?.email).toEqual(context.testSessionStoreData.email);
    expect(request.retrievedSessionData?.userId).toEqual(context.testSessionStoreData.userId);
  });
});
