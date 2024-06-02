import { describe, expect, test } from "vitest";
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from "../middlewareTestUtils.js";

import { RequiredMiddlewareNotCalledError } from "../errors/errorClasses.js";
import { handleSessionIdAfterDataRetrieval } from "./handleSessionId.js";

describe('chain.handleSessionIdAfterDataRetrieval', () => {
  test('Should call to error handler when sessionID is not set.', () => {
    const { error } = verifyHandlerFunctionCallsNextWithError(
      handleSessionIdAfterDataRetrieval, { sessionID: undefined },
      { locals: { calledHandlers: ['handleNewSessionWithNoSessionData', 'handleExistingSessionWithNoSessionData'] } });
    expect(error.status).toBe(500);
  });

  test('Should call to next and not call error handler when sessionID is set.', () => {
    verifyHandlerFunctionCallsNext(
      handleSessionIdAfterDataRetrieval, { sessionID: 'abc-1243' },
      { locals: { calledHandlers: ['handleNewSessionWithNoSessionData', 'handleExistingSessionWithNoSessionData'] } });
  });

  test('Should error out when prerequisite handler has not been called.', () => {
    const unsetEnvAfter = process.env['HANDLER_ASSERTIONS_ENABLED'] === undefined;
    const resetEnvAfter = process.env['HANDLER_ASSERTIONS_ENABLED'];
    process.env['HANDLER_ASSERTIONS_ENABLED'] = 'true';

    try {
      expect(() => verifyHandlerFunctionCallsNextWithError(
        handleSessionIdAfterDataRetrieval, { sessionID: undefined }))
        .toThrowError(expect.any(RequiredMiddlewareNotCalledError));
    } finally {
      if (unsetEnvAfter) {
        delete process.env['HANDLER_ASSERTIONS_ENABLED'];
      } else if (resetEnvAfter) {
        process.env['HANDLER_ASSERTIONS_ENABLED'] = resetEnvAfter;
      }
    };
  });
});
