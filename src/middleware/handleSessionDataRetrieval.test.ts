import {
  SessionDataTestContext,
  createContextForSessionTest,
  createMockPromisePair,
  createTestRequestSessionData
} from "../testUtils.js";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SessionData } from "../express-session/index.js";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import { handleSessionDataRetrieval } from './storedSessionData.js';

describe('handleSessionDataRetrieval', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));
  
  test('Should error when newly generated session has no sessionID.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: undefined,
    }, {
      markHandlersCalled: ['handleSessionIdRequired'],
    });

    // should not call store.get
    request.sessionStore.get = vi.fn();

    const [ callbackPromiseNext, callbackMockNext ]: [Promise<void>, typeof next] = createMockPromisePair(next);
    handleSessionDataRetrieval(request, response, callbackMockNext);
    // should not call store.get
    expect(request.sessionStore.get).not.toBeCalled();
    await callbackPromiseNext;
    expect(callbackMockNext).toHaveBeenCalledWith(expect.any(SessionHandlerError));
  });

  test('Should call next handler function for a newly generated session.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    }, {
      markHandlersCalled: ['handleSessionIdRequired'],
    });

    // should not call store.get
    request.sessionStore.get = vi.fn();
    const [ callbackPromiseNext, callbackMockNext ]: [Promise<void>, typeof next] = createMockPromisePair(next);

    handleSessionDataRetrieval(request, response, callbackMockNext);
    // should not call store.get
    expect(request.sessionStore.get).not.toBeCalled();
    await callbackPromiseNext;
    expect(callbackMockNext).toHaveBeenCalledWith();
    expect(response.locals.retrievedSessionData).toBeUndefined();
  });

  test('Should call next handler function for existing id that returns no data.', async (context) => {
    const testSessionId = 'session-5432';
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: false,
      sessionID: testSessionId,
    }, {
      markHandlersCalled: ['handleSessionIdRequired'],
    });
    context.memoryStore?.set(testSessionId, context.testSessionStoreData);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.memoryStore!.get = vi.fn((_sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
      callback(undefined, undefined);
    }) as never;

    const [ callbackPromiseNext, callbackMockNext ]: [Promise<void>, typeof next] = createMockPromisePair(next);

    handleSessionDataRetrieval(request, response, callbackMockNext);
    expect(context.memoryStore!.get).toBeCalled();
    await callbackPromiseNext;
    expect(callbackMockNext).toBeCalled();
    expect(callbackMockNext).toHaveBeenCalledWith();
    expect(response.locals.retrievedSessionData).toBeUndefined();
  });

  test('Should not call next when an error occurs for an existing id.', async (context) => {
    const testSessionId = 'session-5432';
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: false,
      sessionID: testSessionId,
    }, {
      markHandlersCalled: ['handleSessionIdRequired'],
    });

    const testError: Error = new Error('Generic session storage error occurred.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.memoryStore!.get = vi.fn((_sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
      callback(testError, undefined);
    }) as never;
    const [callbackPromiseNext, callbackMockNext]: [Promise<void>, typeof next] = createMockPromisePair(next);

    handleSessionDataRetrieval(request, response, callbackMockNext);
    expect(context.memoryStore!.get).toBeCalled();
    await callbackPromiseNext;
    expect(callbackMockNext).toBeCalledWith(expect.any(SessionHandlerError));
    expect(response.locals.retrievedSessionData).toBeUndefined();
  });

  test('Should call next hanlder function for existing id that has data.', async (context) => {
    const testSessionId = 'session-6543';
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: false,
      sessionID: testSessionId,
    }, {
      markHandlersCalled: ['handleSessionIdRequired'],
    });

    response.locals.calledHandlers = ['handleSessionIdRequired'];

    context.memoryStore?.set(testSessionId, context.testSessionStoreData);
    const [callbackPromiseNext, callbackMockNext]: [Promise<void>, typeof next] = createMockPromisePair(next);

    handleSessionDataRetrieval(request, response, callbackMockNext);
    await callbackPromiseNext;
    expect(callbackMockNext).toHaveBeenCalledWith();
    expect(response.locals.retrievedSessionData?.email).toEqual(context.testSessionStoreData.email);
    expect(response.locals.retrievedSessionData?.userId).toEqual(context.testSessionStoreData.userId);
  });
});
