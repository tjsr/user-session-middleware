import * as expressSession from './express-session/index.ts';

import {
  ConfigurationOptionRequiredError,
  MiddlewareConfigurationError,
  SetCookieHeaderNotPermittedError,
} from './errors/errorClasses.ts';

import { IncomingHttpHeaders } from 'http';
import { RequestHandler } from './express/index.ts';
import { SessionId } from './types.ts';
import { SessionMiddlewareError } from './errors/SessionMiddlewareError.ts';
import { SystemHttpRequestType } from './types/request.ts';
import { UUIDNamespaceNotDefinedError } from './errors/middlewareErrorClasses.ts';
import { UserSessionData } from './types/session.ts';
import { UserSessionOptions } from './types/sessionOptions.ts';
import { getCookieKeyFromRequest } from './session/sessionCookie.ts';
import { getDefaultUserIdNamespace } from './user/userIdNamespace.ts';
import { isProductionMode } from '@tjsr/simple-env-utils';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const memoryStore = new expressSession.MemoryStore();

const IN_PROD = process.env['NODE_ENV'] === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;
export const SESSION_ID_COOKIE = process.env['SESSION_ID_COOKIE'] || 'usm.sid';
export const SESSION_SECRET = process.env['SESSION_ID_SECRET'] || uuidv4();

export const getSessionIdFromRequestHeader = (): never => {
  throw new SessionMiddlewareError('USM no longer uses session header - use cookies instead.');
};

const verifyNoIllegalSetCookie = (req: SystemHttpRequestType<UserSessionData>): void => {
  if (req.headers['set-cookie']) {
    throw new SetCookieHeaderNotPermittedError();
  }
};

export const getSessionIdFromCookie = (
  req: SystemHttpRequestType<UserSessionData>,
  sessionIdKey: string
): SessionId | string | undefined => {
  assert(req !== undefined, 'Request must be defined to get session ID from cookie.');
  verifyNoIllegalSetCookie(req);
  if (req?.signedCookies) {
    console.debug(getSessionIdFromCookie, 'Signed cookies:', req.signedCookies);
  }
  const cookies = req.cookies;
  const signedCookies = req.signedCookies;

  if (!cookies && !req?.signedCookies) {
    const headers: IncomingHttpHeaders = req.headers;
    const cookieHeader = headers['cookie'] || headers['Cookie'];
    let noCookieMessage = 'No cookies (including signed cookies) set on request';
    if (cookieHeader === undefined) {
      noCookieMessage += ' and no cookie header present';
    }
    console.debug(getSessionIdFromCookie, noCookieMessage, cookieHeader, req.headers, req.sessionID || req.session?.id);
    return undefined;
  }
  const cookieValue = (signedCookies && signedCookies[signedCookies]) || cookies[sessionIdKey];
  if (cookieValue !== undefined && cookieValue !== 'undefined') {
    console.debug(getSessionIdFromCookie, `Got a cookie session Id with value ${cookieValue}`);
  } else {
    console.debug(getSessionIdFromCookie, 'No cookie session Id found on request');
  }
  return cookieValue;
};

export const requestHasSessionId = (
  req: SystemHttpRequestType<UserSessionData>,
  sessionCookieId: string = SESSION_ID_COOKIE
): boolean => {
  if (req.sessionID !== undefined) {
    return true;
  }
  if (req.session === undefined) {
    return false;
  }
  if (req.session.id) {
    return true;
  }

  return !!getSessionIdFromCookie(req, sessionCookieId);
};

// prettier-ignore
export const sessionIdFromRequest = <
  RequestType extends SystemHttpRequestType<DataType>,
  DataType extends UserSessionData = UserSessionData,
  >(
    req: RequestType
  ): string => {
  const cookieKey = getCookieKeyFromRequest(req);
  if (req.regenerateSessionId) {
    const generatedId = uuidv4();
    req.newSessionIdGenerated = true;
    return generatedId;
  }

  if (req.session?.id) {
    req.newSessionIdGenerated = false;
    return req.session.id;
  }

  if (req.sessionID) {
    req.newSessionIdGenerated = false;
    return req.sessionID;
  }

  console.log(sessionIdFromRequest,
    'USM should not have to look up cookie - this should be handled by express-session');
  const sessionIdFromCookie: string | undefined = getSessionIdFromCookie(req, cookieKey);
  if (sessionIdFromCookie) {
    req.newSessionIdGenerated = false;
    return sessionIdFromCookie;
  }

  const generatedId = uuidv4();
  req.newSessionIdGenerated = true;
  return generatedId;
};

export const defaultExpressSessionCookieOptions = (
  cookieOptions?: expressSession.CookieOptions | undefined
): expressSession.CookieOptions => {
  const defaultCookie: expressSession.CookieOptions = {
    maxAge: IN_PROD ? TWO_HOURS : TWENTYFOUR_HOURS,
    path: '/',
    sameSite: true,
    secure: IN_PROD,
  };
  return {
    ...defaultCookie,
    ...cookieOptions,
  };
};

export const defaultExpressSessionOptions = (
  options?: Partial<expressSession.SessionOptions> | undefined
): expressSession.SessionOptions => {
  const defaults: expressSession.SessionOptions = {
    genid: options?.genid,
    name: options?.name || SESSION_ID_COOKIE,
    resave: options?.resave || false,
    rolling: options?.rolling || false,
    saveUninitialized: options?.saveUninitialized || false,
    secret: options?.secret || SESSION_SECRET,
    store: options?.store || memoryStore,
  };
  return {
    ...defaults,
    ...options,
    cookie: defaultExpressSessionCookieOptions(options?.cookie),
  };
};

export const defaultUserSessionOptions = (options: UserSessionOptions): UserSessionOptions => {
  return {
    ...options,
  } as UserSessionOptions;
};

const validateUserSessionMiddlewareOptions = (sessionOptions: UserSessionOptions): void => {
  if (sessionOptions && sessionOptions.store === undefined) {
    if (isProductionMode()) {
      throw new MiddlewareConfigurationError('Session store must be defined in production mode.');
    }
    sessionOptions.store = memoryStore;
  }

  if (!sessionOptions.name) {
    throw new ConfigurationOptionRequiredError('name');
  }
  if ((sessionOptions as UserSessionOptions).userIdNamespace === undefined) {
    throw new UUIDNamespaceNotDefinedError();
  }
};

export const getUserSessionMiddlewareOptions = (options: UserSessionOptions): UserSessionOptions => {
  let sessionOptions: UserSessionOptions = {
    ...defaultExpressSessionOptions(options),
    userIdNamespace: getDefaultUserIdNamespace(options)!,
  };
  sessionOptions = defaultUserSessionOptions(sessionOptions);
  return sessionOptions;
};

export const expressSessionHandlerMiddleware = (options: UserSessionOptions): RequestHandler => {
  if (options && options.store === undefined) {
    if (isProductionMode()) {
      throw new MiddlewareConfigurationError('Session store must be defined in production mode.');
    }
    options.store = memoryStore;
  }

  validateUserSessionMiddlewareOptions(options);
  if (options.debugSessionOptions) {
    console.debug(expressSessionHandlerMiddleware, 'Session options:', options);
  }
  return session(options);
};
