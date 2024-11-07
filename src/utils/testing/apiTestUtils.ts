import {
  ApiTestContext,
  SessionOptionsTaskContext,
  SessionTestContext,
  UserAppTaskContext,
} from '../../api/utils/testcontext.js';
import { EmailAddress, Provides, SessionId } from '../../types.js';
import { RetrieveUserDataFn, setRetrieveUserDataFunction } from '../../auth/getDbUser.js';

import { getAppSessionIdCookieKey, getAppSessionIdHeaderKey } from '../../middleware/appSettings.js';
import { LoginCredentialsError } from '../../errors/authenticationErrorClasses.js';
import { SessionMiddlewareTestSetupError } from '../../errors/errorClasses.js';
import { Test } from 'supertest';
import { UserModel } from '../../types/model.js';
import { getSupertestSessionIdCookie } from '@tjsr/testutils';
import { setSessionCookie } from '../../../../testutils/dist/esm/cookieTestUtils.js';
import supertest from 'supertest';
import { testableApp } from './middlewareTestUtils.js';

export const setLoginUserLookupWithContextUserData = <T extends UserModel>(
  userData: Map<string, unknown>
): RetrieveUserDataFn<T> => {
  const loginUserLookup: RetrieveUserDataFn<T> = async (email: EmailAddress): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const userDataValue = userData.get(email) as T;
      if (userDataValue) {
        return resolve(userDataValue);
      }
      console.warn('No user data found for email:', email);
      return reject(new LoginCredentialsError());
    });
  };
  setRetrieveUserDataFunction(loginUserLookup);
  return loginUserLookup;
};

const createLoginBody = (email: string) => {
  return {
    email,
  };
};

export const loginWith = async (
  context: UserAppTaskContext & SessionOptionsTaskContext & Provides<SessionTestContext, 'sessionId'>,
  email?: EmailAddress,
  sessionId?: SessionId
): Promise<supertest.Response> => {
  if (!context.app) {
    throw new SessionMiddlewareTestSetupError('No context.app');
  }
  if (!context.app.locals) {
    throw new SessionMiddlewareTestSetupError('No context.app.locals');
  }

  let st: Test = supertest(context.app).post('/login');

  if (email) {
    const loginBody = createLoginBody(email);
    st = st.send(loginBody);
  }

  st.set('Content-Type', 'application/json').accept('application/json');

  if (getAppSessionIdHeaderKey(context.app.locals)) {
    // TODO: Check sessionId/x-session-id type headers.
    throw new Error('This functionality is currently disabled - use cookies for sessionId passing');
    // const header = getAppSessionIdHeaderKey(context.app);
    // st.set(header, sessionId!);
    // const response = await st;
    // context.currentSessionId = getSupertestSessionIdCookie(header, response);
  }

  const key = getAppSessionIdCookieKey(context.app.locals);
  if (!key) {
    throw new Error('No session cookie key configured.');
  }
  if (sessionId) {
    setSessionCookie(st, key, sessionId);
  }
  const response = await st;
  (context as SessionTestContext).sessionId = getSupertestSessionIdCookie(key, response);
  return Promise.resolve(response);
};

export const logoutFrom = async (context: ApiTestContext, sessionId?: SessionId): Promise<supertest.Response> => {
  if (!context.app) {
    context.app = testableApp(context.sessionOptions);
  }

  sessionId = sessionId || context.sessionId;
  const st: Test = supertest(context.app).get('/logout');

  st.set('Content-Type', 'application/json').accept('application/json');
  const headerKey = getAppSessionIdHeaderKey(context.app.locals);
  if (headerKey) {
    // TODO: Check sessionId/x-session-id type headers.
    throw new Error(`This functionality is currently disabled - use cookies for sessionId passing - got ${headerKey}`);
  }

  const key = getAppSessionIdCookieKey(context.app.locals);
  if (key) {
    setSessionCookie(st, key, sessionId!);
  }
  const response = await st;
  if (key) {
    context.sessionId = getSupertestSessionIdCookie(key, response);
  }
  return Promise.resolve(response);
};
