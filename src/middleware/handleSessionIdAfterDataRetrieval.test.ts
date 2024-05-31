import { describe, expect, test } from "vitest";
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from "../middlewareTestUtils.js";

import { handleSessionIdAfterDataRetrieval } from "./handleSessionId.js";

describe('handleSessionIdAfterDataRetrieval', () => {
  test('Should call to error handler when sessionID is not set.', () => {
    const { error } = verifyHandlerFunctionCallsNextWithError(
      handleSessionIdAfterDataRetrieval, { sessionID: undefined });
    expect(error.status).toBe(500);
  });

  test('Should call to next and not call error handler when sessionID is set.', () => {
    verifyHandlerFunctionCallsNext(
      handleSessionIdAfterDataRetrieval, { sessionID: 'abc-1243' });
  });
});
