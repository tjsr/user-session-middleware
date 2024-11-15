import { EmailAddress, SessionId } from "../../types.js";
import { RetrieveUserDataFn, setRetrieveUserDataFunction } from "../../auth/getDbUser.js";
import supertest, { Test } from 'supertest';

import { ApiTestContext } from '../../api/utils/testcontext.js';
import { LoginCredentialsError } from '../../errors/authenticationErrorClasses.js';
import { UserModel } from '../../types/model.js';
import { getSupertestSessionIdCookie } from './cookieTestUtils.js';
import { setSupertestCookieHeader } from './setSupertestCookieHeader.js';
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
  context: ApiTestContext,
  email?: EmailAddress,
  sessionId?: SessionId
): Promise<supertest.Response> => {
  if (!context.app) {
    context.app = testableApp(context.sessionOptions);
  }

  let st = supertest(context.app).post('/login');

  if (email) {
    const loginBody = createLoginBody(email);
    st = st.send(loginBody);
  }

  st = st.set('Content-Type', 'application/json').accept('application/json');
  st = setSupertestCookieHeader(context, st, sessionId);

  const response = await st;
  context.currentSessionId = getSupertestSessionIdCookie(response);

  return response;
};

export const logoutFrom = async (context: ApiTestContext, sessionId?: SessionId): Promise<supertest.Response> => {
  if (!context.app) {
    context.app = testableApp(context.sessionOptions);
  }

  let st: Test = supertest(context.app).get('/logout');

  st = st.set('Content-Type', 'application/json').accept('application/json');
  st = setSupertestCookieHeader(context, st, sessionId);

  const response: supertest.Response = await st;
  context.currentSessionId = getSupertestSessionIdCookie(response);

  return response;
};
