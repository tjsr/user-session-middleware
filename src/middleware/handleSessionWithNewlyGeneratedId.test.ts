import {
  SessionDataTestContext,
  createContextForSessionTest,
  createTestRequestSessionData,
} from "../testUtils";
import { beforeEach, describe, expect, test } from "vitest";

import { SessionHandlerError } from "../errors";
import { handleSessionWithNewlyGeneratedId } from "./handleSessionId";

describe('handleSessionWithNewlyGeneratedId', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should call save when a session is newly generated.', (context) => {
    const { next, request, response } = createTestRequestSessionData(context, {
      newSessionIdGenerated: true,
      sessionID: 'session-1234',
    }, {});

    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith();
    expect(request.session.save).toHaveBeenCalled();
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
