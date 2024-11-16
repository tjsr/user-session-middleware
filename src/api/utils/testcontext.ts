import { EmailAddress, IdNamespace, SessionId } from '../../types.js';
import { MemoryStore, Store } from '../../express-session/index.js';

import { AuthenticationRestResult } from '../../types/apiResults.js';
import { MockRequestWithSession } from '../../testUtils.js';
import { SESSION_ID_HEADER_KEY } from '../../getSession.js';
import { TaskContext } from 'vitest';
import { UserModel } from '../../types/model.js';
import { UserSessionData } from '../../types/session.js';
import { UserSessionOptions } from '../../types/sessionOptions.js';
import express from '../../express/index.js';
import { getSupertestSessionIdCookie } from '../../utils/testing/cookieTestUtils.js';
import { setRetrieveUserDataFunction } from '../../auth/getDbUser.js';
import { setUserIdNamespaceForTest } from '../../utils/testing/testNamespaceUtils.js';
import supertest from 'supertest';
import { testableApp } from '../../utils/testing/middlewareTestUtils.js';
import { validate } from 'uuid';

export type UserIdTaskContext = TaskContext & {
  userIdNamespace: IdNamespace;
};

export interface SessionDataTestContext extends UserIdTaskContext {
  memoryStore?: Store;
  testRequestData: MockRequestWithSession;
  testSessionStoreData: UserSessionData;
}

export type UserAppTaskContext = UserIdTaskContext & {
  app: express.Application;
};

export type ApiTestContext = TaskContext &
  UserIdTaskContext &
  SessionTestContext &
  UserAppTaskContext & {
    userData: Map<EmailAddress, UserModel | undefined>;
  };

export interface SessionTestContext extends TaskContext {
  currentSessionId?: SessionId;
  sessionOptions: Partial<UserSessionOptions>;
}

export const setupApiTest = (context: ApiTestContext) => {
  const namespace: IdNamespace = setUserIdNamespaceForTest(context);
  context.sessionOptions = {
    debugCallHandlers: false,
    store: new MemoryStore(),
    userIdNamespace: namespace,
  };
  context.userIdNamespace = namespace;
  context.userData = new Map();
  setRetrieveUserDataFunction(undefined!);
};

export const verifyAuthSessionId = (response: supertest.Response, context: ApiTestContext): SessionId => {
  expect(context.currentSessionId).not.toBeUndefined();
  assert(validate(context.currentSessionId), 'session ID should be a UUID value');
  expect(response.body, 'Authentication response body expected to be present').not.toBeUndefined();
  expect(response.body.message).not.toEqual('Unknown authentication error');
  expect(response.body.sessionId, 'Authentication response body expected to contain sessionId').toEqual(
    context.currentSessionId
  );
  return context.currentSessionId!;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const refreshSession = async (context: ApiTestContext, sessionId?: SessionId): Promise<supertest.Response> => {
  if (!context.app) {
    context.app = testableApp(context.sessionOptions);
  }

  let st = supertest(context.app).get('/session');

  st.set('Content-Type', 'application/json').accept('application/json');

  if (sessionId) {
    st = st.set(SESSION_ID_HEADER_KEY, sessionId);
  } else if (context.currentSessionId) {
    st = st.set(SESSION_ID_HEADER_KEY, context.currentSessionId);
  }
  const response = await st;
  context.currentSessionId = getSupertestSessionIdCookie(response);

  return response;
};
