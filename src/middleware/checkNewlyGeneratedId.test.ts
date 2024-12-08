import { SessionTestContext, setupSessionContext } from '../utils/testing/context/session.js';
import { TaskContext, beforeEach, describe, expect, test } from 'vitest';
import { createContextForSessionTest, createTestRequestSessionData } from '../testUtils.js';

import { SessionDataTestContext } from '../api/utils/testcontext.js';
import { SessionEnabledRequestContext } from '../utils/testing/context/request.js';
import { SessionHandlerError } from '../errors/SessionHandlerError.js';
import { checkNewlyGeneratedId } from './handleSessionId.js';

describe<SessionDataTestContext>('checkNewlyGeneratedId', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext & TaskContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
  });

  test<SessionEnabledRequestContext>('Should throw error if sessionID on request is not set for newly generated id', (context) => {
    const {
      next,
      request,
      response: _response,
    } = createTestRequestSessionData(
      context,
      {
        newSessionIdGenerated: true,
        sessionID: undefined,
      },
      {}
    );

    const returnValue = checkNewlyGeneratedId(request, next);
    expect(returnValue).toEqual(true);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
  });

  test<SessionEnabledRequestContext>('Should skip to next handler if sessionID is set and is a newly generated id', (context) => {
    const {
      next,
      request,
      response: _response,
    } = createTestRequestSessionData(
      context,
      {
        newSessionIdGenerated: true,
        sessionID: 'session-1234',
      },
      {}
    );

    const returnValue = checkNewlyGeneratedId(request, next);
    expect(returnValue).toEqual(true);
    expect(next).toHaveBeenCalledWith();
  });

  test<SessionEnabledRequestContext>('Should not skip to error handler or next if sessionID is not set but this is not a newly generated id', (context) => {
    const {
      next,
      request,
      response: _response,
    } = createTestRequestSessionData(
      context,
      {
        newSessionIdGenerated: false,
        sessionID: 'session-1234',
      },
      {}
    );

    const returnValue = checkNewlyGeneratedId(request, next);
    expect(returnValue).toEqual(false);
    expect(next).not.toHaveBeenCalled();
  });
});
