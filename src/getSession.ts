import * as expressSession from 'express-session';

import { IncomingHttpHeaders } from 'http';
import { RequestHandler } from './express/index.js';
import { SessionId } from './types.js';
import { SystemHttpRequestType } from './types/request.js';
import { UserSessionData } from './types/session.js';
import { UserSessionOptions } from './types/sessionOptions.js';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const memoryStore = new session.MemoryStore();

const IN_PROD = process.env['NODE_ENV'] === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;
export const SESSION_ID_HEADER_KEY = 'x-session-id';
export const SESSION_ID_COOKIE = process.env['SESSION_ID_COOKIE'] || 'usm.sid';
export const SESSION_SECRET = process.env['SESSION_ID_SECRET'] || uuidv4();

export const getSessionIdFromRequestHeader = (
  req: SystemHttpRequestType<UserSessionData>,
  sessionIdHeaderKey: string = SESSION_ID_HEADER_KEY
): string | undefined => {
  const headers: IncomingHttpHeaders = req.headers;
  const sessionIdHeader: SessionId | string | string[] | undefined = headers[sessionIdHeaderKey];
  if (sessionIdHeader) {
    console.log(
      getSessionIdFromRequestHeader,
      `Found session id with header key ${sessionIdHeaderKey}`,
      sessionIdHeader
    );
  }

  if (typeof sessionIdHeader === 'string' && sessionIdHeader !== 'undefined') {
    return sessionIdHeader;
  }
  return undefined;
};

export const getSessionIdFromCookie = (
  req: SystemHttpRequestType<UserSessionData>,
  sessionIdKey: string
): SessionId | string | undefined => {
  const signedCookies = req.signedCookies;
  console.debug(getSessionIdFromCookie, 'Signed cookies:', signedCookies);
  const cookies = req.cookies;
  if (!cookies) {
    const headers: IncomingHttpHeaders = req.headers;
    const cookieHeader = headers['cookie'] || headers['Cookie'];
    console.debug(getSessionIdFromCookie, 'No cookies set on request', cookieHeader, req.headers);
    return undefined;
  }
  const cookieValue = cookies[sessionIdKey] === 'undefined' ? undefined : cookies[sessionIdKey];
  if (cookieValue) {
    console.debug(getSessionIdFromCookie, `Got a cookie session Id with value ${cookieValue}`);
  } else {
    console.debug(getSessionIdFromCookie, 'No cookie session Id found on request');
  }
  return cookieValue;
};

export const requestHasSessionId = (
  req: SystemHttpRequestType<UserSessionData>,
  sessionCookieId: string = SESSION_ID_COOKIE,
  sessionHeaderId: string = SESSION_ID_HEADER_KEY
): boolean => {
  return !!getSessionIdFromRequestHeader(req, sessionHeaderId) || !!getSessionIdFromCookie(req, sessionCookieId);
};

// prettier-ignore
export const sessionIdFromRequest = <
  RequestType extends SystemHttpRequestType<DataType>,
  DataType extends UserSessionData = UserSessionData,
  >(
    req: RequestType
  ): string => {
  if (req.regenerateSessionId) {
    const generatedId = uuidv4();
    req.newSessionIdGenerated = true;
    return generatedId;
  }

  const appLocals = req.app?.locals;
  let headerKey = SESSION_ID_HEADER_KEY;
  if (appLocals !== undefined && appLocals['sessionIdHeaderKey']) {
    headerKey = appLocals['sessionIdHeaderKey'];
  }
  const sessionIdFromRequest: string | undefined = getSessionIdFromRequestHeader(req, headerKey);
  if (sessionIdFromRequest) {
    req.newSessionIdGenerated = false;
    return sessionIdFromRequest;
  }

  if (req.session?.id) {
    req.newSessionIdGenerated = false;
    return req.session.id;
  }

  if (req.sessionID) {
    req.newSessionIdGenerated = false;
    return req.sessionID;
  }

  let cookieKey = SESSION_ID_COOKIE;
  if (appLocals !== undefined && appLocals['cookieSessionIdName']) {
    cookieKey = req.app?.locals['cookieSessionIdName'];
  }
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
  options?: Partial<expressSession.SessionOptions> | undefined,
  useSessionStore: expressSession.Store = memoryStore
): expressSession.SessionOptions => {
  const defaults: expressSession.SessionOptions = {
    genid: sessionIdFromRequest,
    name: options?.name || SESSION_ID_COOKIE,
    resave: false,
    rolling: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    store: useSessionStore,
  };
  return {
    ...defaults,
    ...options,
    cookie: defaultExpressSessionCookieOptions(options?.cookie),
  };
};

export const defaultUserSessionOptions = (options: UserSessionOptions): expressSession.SessionOptions => {
  return {
    ...options,
  };
};

export const expressSessionHandlerMiddleware = (
  options?: Partial<expressSession.SessionOptions> | undefined,
  useSessionStore: expressSession.Store = memoryStore
): RequestHandler => {
  let sessionOptions = defaultExpressSessionOptions(options, useSessionStore);
  sessionOptions = defaultUserSessionOptions(sessionOptions);
  assert(sessionOptions.name, 'Session name must be defined by this point.');
  console.debug(expressSessionHandlerMiddleware, 'Session options:', sessionOptions);
  return session(sessionOptions);
};
