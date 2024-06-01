import { describe, expect, test } from "vitest";
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from "../middlewareTestUtils.js";

import { RequiredMiddlewareNotCalledError } from "../errors/errorClasses.js";
import { handleSessionIdAfterDataRetrieval } from "./handleSessionId.js";

describe('chain.handleSessionIdAfterDataRetrieval', () => {
  test('Should call to error handler when sessionID is not set.', () => {
    const { error } = verifyHandlerFunctionCallsNextWithError(
      handleSessionIdAfterDataRetrieval, { sessionID: undefined },
      { locals: { calledHandlers: ['handleSessionWithNoSessionData'] } });
    expect(error.status).toBe(500);
  });

  test('Should call to next and not call error handler when sessionID is set.', () => {
    verifyHandlerFunctionCallsNext(
      handleSessionIdAfterDataRetrieval, { sessionID: 'abc-1243' },
      { locals: { calledHandlers: ['handleSessionWithNoSessionData'] } });
  });

  test('Should error out when prerequisite handler has not been called.', () => {
    expect(() => verifyHandlerFunctionCallsNextWithError(
      handleSessionIdAfterDataRetrieval, { sessionID: undefined }))
      .toThrowError(expect.any(RequiredMiddlewareNotCalledError));
  });
});
