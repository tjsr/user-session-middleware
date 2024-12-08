import { EmailAddress, SessionId } from '../../types.js';
import {
  NoSessionTestContext,
  SessionTestContext,
  WithSessionTestContext,
  setupSessionContext,
} from '../../utils/testing/context/session.js';
import express, { AppLocals } from '../../express/index.js';

import { AuthenticationRestResult } from '../../types/apiResults.js';
import { MockRequestWithSession } from '../../testUtils.js';
import { TaskContext } from 'vitest';
import { UserIdTaskContext } from '../../utils/testing/context/idNamespace.js';
import { UserModel } from '../../types/model.js';
import { UserSessionData } from '../../types/session.js';
import { UserSessionOptions } from '../../types/sessionOptions.js';
import { setRetrieveUserDataFunction } from '../../auth/getDbUser.js';
import { setupMiddlewareContext } from '../../utils/testing/context/appLocals.js';
import supertest from 'supertest';

export interface SessionDataTestContext extends UserIdTaskContext {
  testRequestData: MockRequestWithSession;
  testSessionStoreData: UserSessionData;
}

export type ExpressAppWithLocals = express.Application & {
  locals: AppLocals;
};

export type ExpressAppTaskContext = {
  app: ExpressAppWithLocals;
};

export type UserAppTaskContext = UserIdTaskContext & ExpressAppTaskContext;

export type SupetestOptionsTaskContext<SessionType extends SessionTestContext = WithSessionTestContext> = TaskContext &
  SessionType & {
    accepts?: string;
    applicationType?: string;
    loginEmail?: EmailAddress;
    requestMethod?: undefined | 'get' | 'post' | 'put' | 'delete';
    startingUrl?: string;
  };

export type SupetestTaskContext<SessionType extends SessionTestContext = WithSessionTestContext> =
  SupetestOptionsTaskContext<SessionType> & {
    st: supertest.Test;
  };

export type ApiTestContext<STC extends SessionTestContext = SessionTestContext> = UserIdTaskContext &
  STC &
  UserAppTaskContext &
  SupetestOptionsTaskContext & {
    userData: Map<EmailAddress, UserModel | undefined>;
  };

export interface MiddlewareHandlerTestContext {
  errorHandlers: express.ErrorRequestHandler[];
  postSessionMiddleware: (express.RequestHandler | express.ErrorRequestHandler)[];
  preSessionMiddleware: (express.RequestHandler | express.ErrorRequestHandler)[];
}

export const setupApiTest = <SessionType extends WithSessionTestContext | NoSessionTestContext>(
  context: TaskContext & { noCreateDefaultRoute?: boolean },
  sessionOptions?: Partial<UserSessionOptions> | undefined
): ApiTestContext<SessionType> => {
  const sessionContext = setupSessionContext(context, sessionOptions);
  setRetrieveUserDataFunction(undefined!);
  setupMiddlewareContext(sessionContext);
  const apiContext: ApiTestContext<SessionType> = context as ApiTestContext<SessionType>;
  apiContext.userData = new Map();
  return apiContext;
};

export const verifyAuthSessionId = (response: supertest.Response, context: ApiTestContext): SessionId => {
  expect(context.currentSessionId).not.toBeUndefined();
  expect(response.body, 'Authentication response body expected to be present').not.toBeUndefined();
  expect(response.body.message).not.toEqual('Unknown authentication error');
  expect(response.body.sessionId, 'Authentication response body expected to contain sessionId').toEqual(
    context.currentSessionId
  );
  return context.currentSessionId!;
};

export const verifyAuthResponseBody = (
  body: AuthenticationRestResult,
  email: EmailAddress | undefined,
  isLoggedIn: boolean = true
) => {
  expect(body).not.toBeUndefined();
  expect(body.isLoggedIn).toEqual(isLoggedIn);
  if (email === undefined) {
    expect(body.email, 'email should not be defined').toBeUndefined();
  } else {
    expect(body.email, 'email in auth body should be provided email').toEqual(email);
  }
};
