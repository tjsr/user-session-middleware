import { ApiTestContext, ExpressAppWithLocals } from '../../api/utils/testcontext.ts';
import { EmailAddress, SessionId } from '../../types.ts';
import {
  MiddlewareTestContextError,
  TestContextMissingAppError,
  TestContextMissingAppLocalsError,
} from '../../errors/SessionMiddlewareError.ts';
import { RetrieveUserDataFn, setRetrieveUserDataFunction } from '../../auth/getDbUser.ts';
import { StrictUserSessionOptions, UserSessionOptions } from '../../types/sessionOptions.ts';

import { LoginCredentialsError } from '../../errors/authenticationErrorClasses.ts';
import { MiddlewareConfigurationError } from '../../errors/errorClasses.ts';
import { SessionTestContext } from './context/session.ts';
import { UserModel } from '../../types/model.ts';
import { doSessionCall } from './supertestUtils.ts';
import express from '../../express/index.ts';
import supertest from 'supertest';

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

const loginWith = async (
  st: supertest.Test,
  email: EmailAddress,
  sessionId: SessionId | undefined,
  sessionOptions: StrictUserSessionOptions
): Promise<{ response: supertest.Response; updatedSessionId: SessionId | undefined }> => {
  if (email) {
    const loginBody = createLoginBody(email);
    st = st.send(loginBody);
  }

  return doSessionCall(st, sessionId, sessionOptions);
};

export const loginWithApp = async (
  app: express.Application,
  email: EmailAddress,
  sessionId?: SessionId | undefined
): Promise<{ response: supertest.Response; updatedSessionId: SessionId | undefined }> => {
  const st = supertest(app).post('/login');

  const sessionOptions: StrictUserSessionOptions = validateSessionOptions(app.locals['sessionOptions']);

  return loginWith(st, email, sessionId, sessionOptions);
};

export const loginWithContext = async (
  context: ApiTestContext<SessionTestContext>,
  email?: EmailAddress | undefined,
  sessionId?: SessionId | undefined
): Promise<supertest.Response> => {
  const loginEmail = email == null ? null : email || context.loginEmail;
  if (email !== null && loginEmail === undefined) {
    throw new Error('Must specify an email address to login with directly or from context.');
  }
  const { response, updatedSessionId } = await loginWithApp(context.app, loginEmail!, sessionId);
  if (updatedSessionId) {
    context.currentSessionId = updatedSessionId;
  }
  return response;
};

export const logoutWithContext = async (
  context: ApiTestContext<SessionTestContext>,
  sessionId?: SessionId
): Promise<supertest.Response> => {
  const sessionOptions: StrictUserSessionOptions = validateContextApp(context);
  const st = supertest(context.app).get('/logout');

  const { response, updatedSessionId } = await doSessionCall(st, sessionId, sessionOptions);
  if (updatedSessionId) {
    context.currentSessionId = updatedSessionId;
  }
  return response;
};

const errorIfNotSet = <CheckType extends object>(value: CheckType, typeName: string, key: keyof CheckType): void => {
  if (value[key] === undefined) {
    throw new MiddlewareConfigurationError(typeName, key);
  }
};

const requireOptions = <CheckType extends object>(
  value: CheckType,
  typeName: string,
  ...keys: (keyof CheckType)[]
): boolean => {
  keys.forEach((key) => {
    errorIfNotSet(value, typeName, key);
  });
  return true;
};

export const validateSessionOptions = (sessionOptions: UserSessionOptions): StrictUserSessionOptions => {
  if (sessionOptions === undefined) {
    throw new MiddlewareTestContextError('ApiTestContext', 'app.locals.sessionOptions');
  }

  requireOptions(sessionOptions, 'UserSessionOptions', 'name', 'secret');

  return sessionOptions as StrictUserSessionOptions;
};

export const validateApp = (app: ExpressAppWithLocals): StrictUserSessionOptions => {
  if (app === undefined) {
    throw new TestContextMissingAppError();
  }
  if (app.locals === undefined) {
    throw new TestContextMissingAppLocalsError();
  }
  const sessionOptions: UserSessionOptions = app.locals['sessionOptions'];
  return validateSessionOptions(sessionOptions);
};

export const validateContextApp = (context: ApiTestContext): StrictUserSessionOptions => {
  return validateApp(context.app);
};
