import { AlreadyLoggedOutError, NotLoggedInError } from '../errors/authenticationErrorClasses.ts';
import { SessionTestContext, setupSessionContext } from '../utils/testing/context/session.ts';
import { checkLogout, logout } from './logout.ts';
import { createContextForSessionTest, createMockPromisePair, createTestRequestSessionData } from '../testUtils.ts';

import { SessionDataTestContext } from './utils/testcontext.ts';
import { SessionEnabledRequestContext } from '../utils/testing/context/request.ts';
import { TaskContext } from 'vitest';
import { generateSessionIdForTest } from '../utils/testing/testIdUtils.ts';

describe<SessionDataTestContext>('logout', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext & TaskContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
  });

  test<SessionEnabledRequestContext>('Should call session.save with a HTTP 200 result if we currently have a user.', async (context) => {
    const sessionId = context.currentSessionId;
    const { next, request, response } = createTestRequestSessionData(
      context,
      {
        sessionID: sessionId,
      },
      {
        spyOnSave: true,
      }
    );

    expect(request.session).toBeDefined();

    const [nextPromise, nextMock] = createMockPromisePair(next);
    logout(request, response, nextMock);
    await nextPromise;

    expect(request.session.save).toHaveBeenCalled();
    expect(response.status).not.toHaveBeenCalled();
    expect(nextMock).toHaveBeenCalledWith();
  });
});

describe<SessionDataTestContext>('checkLogout', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
  });

  test<SessionEnabledRequestContext>('Should return a 401 when a user is not currently logged in.', async (context) => {
    const sessionId = generateSessionIdForTest(context);

    const { next, request, response } = createTestRequestSessionData(
      context,
      {
        sessionID: sessionId,
      },
      {
        overrideSessionData: {
          email: undefined,
          userId: undefined,
        },
        spyOnSave: true,
      }
    );

    expect(request.session).toBeDefined();

    const [nextPromise, nextMock] = createMockPromisePair(next);
    checkLogout(request, response, nextMock);
    await nextPromise;

    expect(nextMock).toHaveBeenCalledWith(expect.any(NotLoggedInError));
    expect(response.status).not.toHaveBeenCalled();
    expect(request.session.save).not.toHaveBeenCalled();
  });

  test<SessionEnabledRequestContext>('Should refuse to log out again and return 401 if the session is already written with hasLoggedOut=true', async (context) => {
    const sessionId = generateSessionIdForTest(context);

    context.testSessionStoreData.hasLoggedOut = true;

    const { next, request, response } = createTestRequestSessionData(
      context,
      {
        sessionID: sessionId,
      },
      {
        silentCallHandlers: false,
        skipAddToStore: true,
      }
    );

    const [nextPromise, nextMock] = createMockPromisePair(next);
    checkLogout(request, response, nextMock);
    await nextPromise;

    expect(response.status).not.toHaveBeenCalled();
    expect(nextMock).toHaveBeenCalledWith(expect.any(AlreadyLoggedOutError));
  });
});
