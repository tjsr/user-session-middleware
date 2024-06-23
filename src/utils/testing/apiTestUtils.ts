import { EmailAddress, SessionId } from "../../types.js";
import { RetrieveUserDataFn, setRetrieveUserDataFunction } from "../../auth/getDbUser.js";

import { ApiTestContext } from "../../api/utils/testcontext.js";
import { LoginCredentialsError } from "../../errors/authenticationErrorClasses.js";
import { SESSION_ID_HEADER_KEY } from "../../getSession.js";
import { UserModel } from "../../types/model.js";
import { getSupertestSessionIdCookie } from "./cookieTestUtils.js";
import supertest from "supertest";
import { testableApp } from "./middlewareTestUtils.js";

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

export const loginWith = async (context: ApiTestContext, email?: EmailAddress, sessionId?: SessionId) => {
  if (!context.app) {
    context.app = testableApp(context.sessionOptions);
  }

  let st = supertest(context.app).post('/login');
  
  if (email) {
    const loginBody = createLoginBody(email);
    st = st.send(loginBody);
  }
  
  st.set('Content-Type', 'application/json')
    .accept('application/json');

  if (sessionId) {
    st = st.set(SESSION_ID_HEADER_KEY, sessionId);
  } else if (context.currentSessionId) {
    st = st.set(SESSION_ID_HEADER_KEY, context.currentSessionId);
  }
  const response = await st;
  context.currentSessionId = getSupertestSessionIdCookie(response);

  return response;
};

export const logoutFrom = async (context: ApiTestContext, sessionId?: SessionId) => {
  if (!context.app) {
    context.app = testableApp(context.sessionOptions);
  }

  let st = supertest(context.app).get('/logout');
  
  st.set('Content-Type', 'application/json')
    .accept('application/json');

  if (sessionId) {
    st = st.set(SESSION_ID_HEADER_KEY, sessionId);
  } else if (context.currentSessionId) {
    st = st.set(SESSION_ID_HEADER_KEY, context.currentSessionId);
  }
  const response = await st;
  context.currentSessionId = getSupertestSessionIdCookie(response);

  return response;
};
