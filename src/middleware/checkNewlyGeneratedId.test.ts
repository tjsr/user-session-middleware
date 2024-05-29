import { SessionDataTestContext, createContextForSessionTest, createTestRequestSessionData } from "../testUtils.js";
import { beforeEach, describe, expect, test } from "vitest";

import { SessionHandlerError } from "../errors.js";
import { checkNewlyGeneratedId } from "./handleSessionId.js";

describe('checkNewlyGeneratedId', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should throw error if sessionID on request is not set for newly generated id', (context) => {
    const { next, request, response: _response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: undefined,
    }, {});
    
    const returnValue = checkNewlyGeneratedId(request, next);
    expect(returnValue).toEqual(true);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
  });

  test('Should skip to next handler if sessionID is set and is a newly generated id', (context) => {
    const { next, request, response: _response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    }, {});

    const returnValue = checkNewlyGeneratedId(request, next);
    expect(returnValue).toEqual(true);
    expect(next).toHaveBeenCalledWith();
  });

  test('Should not skip to error handler or next if sessionID is not set but this is not a newly generated id',
    (context) => {
      const { next, request, response: _response } = createTestRequestSessionData(context, {
        newSessionIdGenerated: false,
        sessionID: 'session-1234',
      }, {});
      
      const returnValue = checkNewlyGeneratedId(request, next);
      expect(returnValue).toEqual(false);
      expect(next).not.toHaveBeenCalled();
    });
});
