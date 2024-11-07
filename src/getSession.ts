import { MiddlewareConfigurationError, SessionIdCookieInvalidError } from './errors/errorClasses.js';
import { getAppSessionIdCookieKey, getAppSessionIdHeaderKey } from './middleware/appSettings.js';

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
export const SESSION_SECRET = process.env['SESSION_ID_SECRET'] || uuidv4();
const DEBUG_SID = process.env['DEBUG_SESSION_ID'] === 'true' || undefined;

export const getSessionIdFromRequestHeader = (req: SystemHttpRequestType<UserSessionData>): string | undefined => {
  if (!req.app) {
    throw new MiddlewareConfigurationError('Request object is not bound to an app');
  }
  const headerKey = getAppSessionIdHeaderKey(req.app.locals);
  if (!headerKey) {
    return undefined;
  }
  const headers: IncomingHttpHeaders = req.headers;
  const sessionIdHeader: SessionId | string | string[] | undefined = headers[headerKey];

  if (typeof sessionIdHeader === 'string' && sessionIdHeader !== 'undefined') {
    console.debug(getSessionIdFromRequestHeader, `sessionId found with header key ${headerKey}`, sessionIdHeader);
    return sessionIdHeader;
  }
  console.debug(getSessionIdFromRequestHeader, 'No sessionId found for header key', headerKey);
  return undefined;
};

export const getSessionIdFromCookie = (req: SystemHttpRequestType<UserSessionData>): SessionId | string | undefined => {
  if (!req.cookies || req.cookies.length === 0) {
    return undefined;
  }
  const sessionCookie = getAppSessionIdCookieKey(req.app.locals);
  let lookupKey: string | undefined;

  if (sessionCookie && req.cookies[sessionCookie]) {
    lookupKey = sessionCookie;
  } else if (sessionCookie !== 'sessionId' && req.cookies.sessionId) {
    throw new SessionIdCookieInvalidError(
      'sessionId is not key for cookie sessions, but was found on request.  This could be an attack.'
    );
  } else if (req.cookies && req.cookies.sessionId) {
    console.warn(
      getSessionIdFromCookie,
      "Explicitly looking up sessionId cookie - configure USM to use 'sessionId' as key instead"
    );
    lookupKey = 'sessionId';
  }
  if (!lookupKey) {
    return undefined;
  }
  const sessionCookieValue: string = req.cookies[lookupKey];

  const cookieValue = sessionCookieValue === 'undefined' ? undefined : sessionCookieValue;
  if (cookieValue) {
    console.debug(getSessionIdFromCookie, `Got a cookie session Id with value ${lookupKey}=${cookieValue}`);
  } else {
    console.debug(getSessionIdFromCookie, 'No cookie session Id found on request', req.cookies);
  }
  return cookieValue;
};

export const requestHasSessionId = (req: SystemHttpRequestType<UserSessionData>): boolean => {
  return !!getSessionIdFromRequestHeader(req) || !!getSessionIdFromCookie(req);
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
  if (req.sessionID) {
    // console.log('Request already has a session id from previous request: ', req.sessionID);
    return req.sessionID;
  }
  if (req.session?.id) {
    req.newSessionIdGenerated = false;
    return req.session.id;
  }

  const sessionIdFromRequest: string | undefined = getSessionIdFromRequestHeader(req);
  if (sessionIdFromRequest) {
    req.newSessionIdGenerated = false;
    return sessionIdFromRequest;
  }

  const sessionIdFromCookie: string | undefined = getSessionIdFromCookie(req);
  if (sessionIdFromCookie) {
    req.newSessionIdGenerated = false;
    return sessionIdFromCookie;
  }

  const generatedId = uuidv4();
  req.newSessionIdGenerated = true;
  return generatedId;
};

export const defaultExpressSessionCookieOptions = (
  cookieOptions?: session.CookieOptions | undefined
): session.CookieOptions => {
  const defaultCookie: session.CookieOptions = {
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
  options?: Partial<session.SessionOptions> | undefined,
  useSessionStore: session.Store = memoryStore
): session.SessionOptions => {
  const defaults: session.SessionOptions = {
    genid: sessionIdFromRequest,
    resave: false,
    rolling: false,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: useSessionStore,
  };
  return {
    ...defaults,
    ...options,
    cookie: defaultExpressSessionCookieOptions(options?.cookie),
  };
};

export const defaultUserSessionOptions = (options: UserSessionOptions): session.SessionOptions => {
  return {
    ...options,
  };
};

export const expressSessionHandlerMiddleware = (
  options?: Partial<session.SessionOptions> | undefined
): RequestHandler => {
  const useSessionStore = options?.store ?? memoryStore;
  let sessionOptions = defaultExpressSessionOptions(options, useSessionStore);
  sessionOptions = defaultUserSessionOptions(sessionOptions);
  if (DEBUG_SID) {
    console.debug(
      expressSessionHandlerMiddleware,
      `Session header will look for ${sessionOptions.name ?? 'default connect.sid'} key`
    );
  }
  return session(sessionOptions);
};
