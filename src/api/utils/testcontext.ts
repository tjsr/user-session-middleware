import { EmailAddress, IdNamespace, SessionId } from '../../types.js';
import { MemoryStore, Store } from '../../express-session/index.js';
import { v5 as uuidv5, validate } from 'uuid';

import { AuthenticationRestResult } from '../../types/apiResults.js';
import { MockRequestWithSession } from '../../testUtils.js';
import { TaskContext } from 'vitest';
import { UserModel } from '../../types/model.js';
import { UserSessionData } from '../../types/session.js';
import { UserSessionOptions } from '../../types/sessionOptions.js';
import express from '../../express/index.js';
import { getSupertestSessionIdCookie } from '../../utils/testing/cookieTestUtils.js';
import { setRetrieveUserDataFunction } from '../../auth/getDbUser.js';
import { setSupertestCookieHeader } from '../../utils/testing/setSupertestCookieHeader.js';
import { setUserIdNamespaceForTest } from '../../utils/testing/testNamespaceUtils.js';
import supertest from 'supertest';
import { testableApp } from '../../utils/testing/middlewareTestUtils.js';

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
    usmVersion?: 1 | 2 | undefined;
  };

export interface SessionTestContext extends TaskContext {
  currentSessionId?: SessionId;
  sessionOptions: Partial<UserSessionOptions>;
}

export const setupApiTest = (context: ApiTestContext) => {
  const namespace: IdNamespace = setUserIdNamespaceForTest(context);
  context.sessionOptions = {
    debugCallHandlers: false,
    name: 'apitest.sid',
    secret: uuidv5(context.task.name, namespace),
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
  st = st.set('Content-Type', 'application/json').accept('application/json');
  st = setSupertestCookieHeader(context, st, sessionId);

  const response = await st;
  context.currentSessionId = getSupertestSessionIdCookie(response);

  return response;
};
