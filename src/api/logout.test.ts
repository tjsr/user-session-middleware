import { AlreadyLoggedOutError, NotLoggedInError } from '../errors/authenticationErrorClasses.js';
import { checkLogout, logout } from './logout.js';
import { createContextForSessionTest, createMockPromisePair, createTestRequestSessionData } from '../testUtils.js';

import { SessionDataTestContext } from './utils/testcontext.js';
import { generateSessionIdForTest } from '../utils/testIdUtils.js';

describe<SessionDataTestContext>('logout', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should call session.save with a HTTP 200 result if we currently have a user.', async (context) => {
    const sessionId = generateSessionIdForTest(context);
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

describe('checkLogout', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should return a 401 when a user is not currently logged in.', async (context: SessionDataTestContext) => {
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

  // eslint-disable-next-line max-len
  test('Should refuse to log out again and return 401 if the session is already written with hasLoggedOut=true', async (context: SessionDataTestContext) => {
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
