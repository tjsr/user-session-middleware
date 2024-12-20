import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from '../../middlewareTestUtils.js';

import { RequiredMiddlewareNotCalledError } from '../../errors/errorClasses.js';
import { forceHandlerAssertions } from '../handlerChainLog.js';
import { handleExistingSessionWithNoSessionData } from './index.js';
import { handleSessionIdAfterDataRetrieval } from './handleSessionIdAfterDataRetrieval.js';

describe('chain.handleSessionIdAfterDataRetrieval', () => {
  test('Should call to error handler when sessionID is not set.', () => {
    const { error } = verifyHandlerFunctionCallsNextWithError(
      handleSessionIdAfterDataRetrieval,
      { sessionID: undefined },
      { locals: { calledHandlers: [handleExistingSessionWithNoSessionData] } }
    );
    expect(error.status).toBe(500);
  });

  test('Should call to next and not call error handler when sessionID is set.', () => {
    verifyHandlerFunctionCallsNext(
      handleSessionIdAfterDataRetrieval,
      { sessionID: 'abc-1243' },
      { locals: { calledHandlers: [handleExistingSessionWithNoSessionData] } }
    );
  });

  test('Should error out when prerequisite handler has not been called.', () => {
    forceHandlerAssertions();

    try {
      expect(() =>
        verifyHandlerFunctionCallsNextWithError(handleSessionIdAfterDataRetrieval, { sessionID: undefined })
      ).toThrowError(expect.any(RequiredMiddlewareNotCalledError));
    } finally {
      forceHandlerAssertions(false);
    }
  });
});
