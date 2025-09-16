import { ApiTestContext, SessionDataTestContext, setupApiTest } from './api/utils/testcontext.ts';
import { SessionTestContext, WithSessionTestContext, setupSessionContext } from './utils/testing/context/session.ts';
import express, { NextFunction } from './express/index.ts';

import { HttpStatusCode } from './httpStatusCodes.ts';
import { SystemHttpRequestType } from './types/request.ts';
import { TaskContext } from 'vitest';
import { UserIdTaskContext } from './utils/testing/context/idNamespace.ts';
import { addDataToSessionStore } from './testUtils.ts';
import { mockSession } from './utils/testing/mocks.ts';
import { setupMiddlewareContext } from './utils/testing/context/appLocals.ts';
import { setupSupertestContext } from './utils/testing/supertestUtils.ts';

describe<UserIdTaskContext>('assignUserIdToRequestSessionHandler', () => {
  beforeEach(
    async (context: ApiTestContext & UserIdTaskContext & SessionTestContext & SessionDataTestContext & TaskContext) => {
      const _sessionContext: SessionTestContext = setupSessionContext(context);
      setupMiddlewareContext(context);
      const sessionStoreData = mockSession(context.sessionOptions.userIdNamespace, { userId: null! });
      await addDataToSessionStore(context, sessionStoreData);

      context.startingUrl = '/';
    }
  );

  test('Should set and save the userId on the request session when data in store has no userId.', async (context: ApiTestContext &
    UserIdTaskContext &
    WithSessionTestContext &
    SessionDataTestContext &
    TaskContext) => {
    const st = setupSupertestContext(context);
    const response = await st;
    expect(response.error).toBeFalsy();
    expect(response.statusCode).toEqual(HttpStatusCode.OK);
  });
});

describe<UserIdTaskContext>('api.handler.assignUserIdToRequestSessionHandler', () => {
  beforeEach(async (context: ApiTestContext & TaskContext & SessionDataTestContext) => {
    setupSessionContext(context, {
      secret: 'test-secret',
    });
    context.startingUrl = '/';

    context.testSessionStoreData = mockSession(context.sessionOptions.userIdNamespace);
  });

  test('Should set and save the userId on the session when no userId set but data in store has a userId.', async (context: ApiTestContext<WithSessionTestContext> &
    SessionDataTestContext &
    TaskContext) => {
    const testUserId = context.testSessionStoreData.userId;

    const _endValidator = (req: SystemHttpRequestType, response: express.Response, next: NextFunction) => {
      if (req.session.userId !== testUserId) {
        // TODO: Use exception
        response.status(500);
        next(new Error(`userId not set correctly: ${req.session.userId} != '${testUserId}'`));
      } else {
        next();
      }
    };

    setupApiTest(context);
    // appWithMiddleware(
    //   context.sessionOptions,
    //   [],
    //   [handleAssignUserIdToRequestSessionWhenNoExistingSessionData, endValidator]
    // );
    // context.app = app;

    await addDataToSessionStore(context, context.testSessionStoreData);

    // const testSecret = 'test-secret';
    context.startingUrl = '/';
    const st = setupSupertestContext(context);
    // st = setSessionCookie(st, SESSION_ID_COOKIE, testSessionId, testSecret).expect(200);
    const response = await st;
    if (response.error) {
      console.error(response.error);
    }
    expect(response.error).toEqual(false);
    expect(response.status).toEqual(HttpStatusCode.OK);
  });
});
