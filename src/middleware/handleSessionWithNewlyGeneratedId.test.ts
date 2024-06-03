import {
  SessionDataTestContext,
  createContextForSessionTest,
  createMockPromisePair,
  createTestRequestSessionData,
} from "../testUtils.js";
import { beforeEach, describe, expect, test } from "vitest";

import { MockRequest } from "vitest-mock-express/dist/src/request/index.js";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import { Store } from "express-session";
import { SystemSessionDataType } from "../types";
import { handleSessionWithNewlyGeneratedId } from "./handleSessionId";

declare module 'vitest' {
  export interface TestContext {
    memoryStore?: Store;
    testRequestData: MockRequest;
    testSessionStoreData: SystemSessionDataType;
  }
};

describe('handler.handleSessionWithNewlyGeneratedId', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should call save when a session is newly generated.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    });

    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(request.session.save).toHaveBeenCalled();
  });

  test('Should call next when a session is newly generated.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    }, {
      noMockSave: true,
    });

    const [nextPromise, nextMock] = createMockPromisePair(next);

    handleSessionWithNewlyGeneratedId(request, response, nextMock);
    console.debug('Awaiting next promise...');
    await nextPromise;
    expect(nextMock).toHaveBeenCalledWith();
  });

  test('Should not save when a session is pre-existing.', (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {}, {});
    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith();
    expect(request.session.save).not.toHaveBeenCalled();
  });

  test('Should call to error handler and not call save if session was not initialized.', (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      sessionID: 'session-2345',
    }, { skipCreateSession: true });

    context.testRequestData.new = true;
    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
    expect(request.session).toBeUndefined();
  });
});
