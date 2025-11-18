import { EmailAddress, SessionId } from '../../types.ts';
import {
  NoSessionTestContext,
  SessionTestContext,
  WithSessionTestContext,
  setupSessionContext,
} from '../../utils/testing/context/session.ts';
import express, { AppLocals } from '../../express/index.ts';

import { AuthenticationRestResult } from '../../types/apiResults.ts';
import { MockRequestWithSession } from '../../testUtils.ts';
import { TestContext } from 'vitest';
import { UserIdTestContext } from '../../utils/testing/context/idNamespace.ts';
import { UserModel } from '../../types/model.ts';
import { UserSessionData } from '../../types/session.ts';
import { UserSessionOptions } from '../../types/sessionOptions.ts';
import { setRetrieveUserDataFunction } from '../../auth/getDbUser.ts';
import { setupMiddlewareContext } from '../../utils/testing/context/appLocals.ts';
import supertest from 'supertest';

export interface SessionDataTestContext extends UserIdTestContext {
  testRequestData: MockRequestWithSession;
  testSessionStoreData: UserSessionData;
}

export type ExpressAppWithLocals = express.Application & {
  locals: AppLocals;
};

export type ExpressAppTestContext = {
  app: ExpressAppWithLocals;
};

export type UserAppTestContext = UserIdTestContext & ExpressAppTestContext;

export type SupetestOptionsTestContext<SessionType extends SessionTestContext = WithSessionTestContext> = TestContext &
  SessionType & {
    accepts?: string;
    applicationType?: string;
    loginEmail?: EmailAddress;
    requestMethod?: undefined | 'get' | 'post' | 'put' | 'delete';
    startingUrl?: string;
  };

export type SupetestTestContext<SessionType extends SessionTestContext = WithSessionTestContext> =
  SupetestOptionsTestContext<SessionType> & {
    st: supertest.Test;
  };

export type ApiTestContext<STC extends SessionTestContext = SessionTestContext> = UserIdTestContext &
  STC &
  UserAppTestContext &
  SupetestOptionsTestContext & {
    userData: Map<EmailAddress, UserModel | undefined>;
  };

export interface MiddlewareHandlerTestContext {
  errorHandlers: express.ErrorRequestHandler[];
  postSessionMiddleware: (express.RequestHandler | express.ErrorRequestHandler)[];
  preSessionMiddleware: (express.RequestHandler | express.ErrorRequestHandler)[];
}

export const setupApiTest = <SessionType extends WithSessionTestContext | NoSessionTestContext>(
  context: TestContext & { noCreateDefaultRoute?: boolean },
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
