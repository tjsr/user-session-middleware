import { ApiTestContext, MiddlewareHandlerTestContext } from '../../api/utils/testcontext.ts';
import {
  NoSessionTestContext,
  SessionTestContext,
  WithSessionTestContext,
  setupSessionContext,
} from '../../utils/testing/context/session.ts';
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from '../../middlewareTestUtils.ts';

import { HttpStatusCode } from '../../httpStatusCodes.ts';
import { TestContext } from 'vitest';
import { createHandlerTestContext } from '../../utils/testing/handlerTestutils.ts';
import { handleSessionIdRequired } from './handleSessionIdRequired.ts';
import { setupSupertestContext } from '../../utils/testing/supertestUtils.ts';

describe('handler.handleSessionIdRequired', () => {
  test('Should fail when no sessionID is provided.', () =>
    verifyHandlerFunctionCallsNextWithError(handleSessionIdRequired, { sessionID: undefined }));

  test('Should fail when no sessionID is provided.', () =>
    verifyHandlerFunctionCallsNext(handleSessionIdRequired, { sessionID: 'test-session-id' }));
});

describe('api.handleSessionIdRequired', () => {
  beforeEach(
    (
      context: ApiTestContext<WithSessionTestContext> & MiddlewareHandlerTestContext & SessionTestContext & TestContext
    ) => {
      context.preSessionMiddleware = [handleSessionIdRequired];
      setupSessionContext(context);
      createHandlerTestContext(context);
      context.startingUrl = '/';
      context.currentSessionId = undefined!;
    }
  );

  test('Should not fail because no sessionId was provided.', async (context: ApiTestContext<NoSessionTestContext>) => {
    // We don't expect an error here because the session generator will assign a new session ID.
    const st = setupSupertestContext(context);
    expect(context.currentSessionId).toBeUndefined();
    const response = await st;

    expect(response.status).toBe(HttpStatusCode.OK);
  });
});
