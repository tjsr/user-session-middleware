import { EmailAddress, IdNamespace, Provides, SessionId } from '../../types.js';
import { MemoryStore, Store } from '../../express-session/index.js';

import express, { AppLocals } from '../../express/index.js';
import { v5 as uuidv5, validate } from 'uuid';
import { AuthenticationRestResult } from '../../types/apiResults.js';
import { MockRequestWithSession } from '../../testUtils.js';
import { TaskContext } from 'vitest';
import { UserModel } from '../../types/model.js';
import { UserSessionData } from '../../types/session.js';
import { UserSessionOptions } from '../../types/sessionOptions.js';
import { addUserIdNamespaceToContext } from '../../utils/testing/testNamespaceUtils.js';
import { getAppSessionIdCookieKey } from '../../middleware/appSettings.js';
import { getSupertestSessionIdCookie } from '@tjsr/testutils';
import { setRetrieveUserDataFunction } from '../../auth/getDbUser.js';
import supertest from 'supertest';
import { testableApp } from '../../utils/testing/middlewareTestUtils.js';
import { SessionMiddlewareTestSetupError } from '../../errors/errorClasses.js';

const TEST_NAMESPACE = 'f1b3b3b4-0b3b-4b3b-8b3b-0b3b3b3b3b3b';

export type UserIdTaskContext = TaskContext & {
  userIdNamespace: IdNamespace;
};

export interface SessionDataTestContext extends UserIdTaskContext {
  memoryStore?: Store;
  testRequestData: MockRequestWithSession;
  testSessionStoreData: UserSessionData;
}

export type USMAppTestContext = SessionDataTestContext &
  UserAppTaskContext & {
    sessionOptions: Partial<UserSessionOptions>;
  };

export type UserAppTaskContext<LocalType extends AppLocals = AppLocals> = UserIdTaskContext & {
  app: express.Application<LocalType>;
};

export type RequestTaskContext = TaskContext & {
  request: Request;
};

export type AppLocalsTaskContext<LocalType extends AppLocals = AppLocals> = TaskContext & {
  appLocals: LocalType;
};

export interface UserDataTaskContext extends TaskContext {
  userData: Map<EmailAddress, UserModel | undefined>;
}

export type ApiTestContext = TaskContext &
  UserIdTaskContext &
  SessionTestContext &
  UserAppTaskContext &
  UserDataTaskContext & {
    testSid: SessionId;
  };

export interface SessionOptionsTaskContext extends TaskContext {
  sessionOptions: Partial<UserSessionOptions>;
}

export interface SessionTestContext extends SessionOptionsTaskContext {
  sessionId?: SessionId;
}

const generateTestCookieSidKey = (context: TaskContext): string => {
  const sidContextShortHash = uuidv5(context.task.name, TEST_NAMESPACE).replaceAll('-', '').slice(0, 8);
  const key = `test.${sidContextShortHash}.sid`;
  return key;
};

export const addSessionOptionsToContext = (
  context: TaskContext | UserIdTaskContext,
  options?: Partial<UserSessionOptions>
): SessionOptionsTaskContext => {
  (context as SessionOptionsTaskContext).sessionOptions = {
    ...options,
    debugCallHandlers: options?.debugCallHandlers ?? false,
    name: options?.name ?? generateTestCookieSidKey(context),
    saveUninitialized: options?.saveUninitialized ?? true,
    store: options?.store ?? new MemoryStore(),
    userIdNamespace: options?.userIdNamespace ?? (context as UserIdTaskContext).userIdNamespace,
  };
  return context as SessionOptionsTaskContext;
};

export const setupApiTest = (
  context: UserIdTaskContext & SessionOptionsTaskContext & UserDataTaskContext & UserIdTaskContext
) => {
  const namespace: IdNamespace = addUserIdNamespaceToContext(context);
  addSessionOptionsToContext(context, { userIdNamespace: namespace });
  context.userData = new Map();
  setRetrieveUserDataFunction(undefined!);
};

export const addAppTestContext = (
  context: SessionOptionsTaskContext & Provides<UserAppTaskContext, 'userIdNamespace'>
): UserAppTaskContext => {
  const appContext = context as unknown as UserAppTaskContext;
  appContext.app = testableApp(context.sessionOptions);
  return appContext;
};

export const verifyAuthSessionId = (response: supertest.Response, context: ApiTestContext): SessionId => {
  expect(context.sessionId).not.toBeUndefined();
  assert(validate(context.sessionId), 'session ID should be a UUID value');
  expect(response.body, 'Authentication response body expected to be present').not.toBeUndefined();
  expect(response.body.message).not.toEqual('Unknown authentication error');
  expect(response.body.sessionId, 'Authentication response body expected to contain sessionId').toEqual(
    context.sessionId
  );
  return context.sessionId!;
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

export const refreshSession = async (
  context: UserAppTaskContext & SessionOptionsTaskContext & Provides<SessionTestContext, 'sessionId'>,
  sessionId?: SessionId
): Promise<supertest.Response> => {
  if (!context.app) {
    throw new SessionMiddlewareTestSetupError('No context.app');
  }
  if (!context.app.locals) {
    throw new SessionMiddlewareTestSetupError('No context.app.locals');
  }

  let st = supertest(context.app).get('/session');

  st.set('Content-Type', 'application/json').accept('application/json');

  // TODO: Use cookie session not header
  // TODO: Enable session id header checking
  const sessionIdHeader = getAppSessionIdCookieKey(context.app.locals);
  if (!sessionIdHeader) {
    throw new Error('SessionId Cookie Key not set');
  }

  if (sessionId) {
    st = st.set(sessionIdHeader, sessionId);
  }
  const response = await st;
  (context as SessionTestContext).sessionId = getSupertestSessionIdCookie(sessionIdHeader, response);

  return Promise.resolve(response);
};
