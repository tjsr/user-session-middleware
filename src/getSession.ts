import * as expressSession from 'express-session';

import { IncomingHttpHeaders } from 'http';
import { RequestHandler } from './express/index.js';
import { SessionId } from './types.js';
import { SystemHttpRequestType } from './types/request.js';
import { UserSessionData } from './types/session.js';
import { UserSessionOptions } from './types/sessionOptions.js';
import { requireEnv } from '@tjsr/simple-env-utils';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const memoryStore = new session.MemoryStore();

const IN_PROD = process.env['NODE_ENV'] === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;
export const SESSION_ID_HEADER_KEY = 'x-session-id';
export const SESSION_SECRET = IN_PROD ? requireEnv('SESSION_ID_SECRET') : process.env['SESSION_ID_SECRET'] || uuidv4();

export const getSessionIdFromRequestHeader = (req: SystemHttpRequestType<UserSessionData>): string | undefined => {
  const headers: IncomingHttpHeaders = req.headers;
  const sessionIdHeader: SessionId | string | string[] | undefined = headers[SESSION_ID_HEADER_KEY];
  console.log(`Searching for session id with header key ${SESSION_ID_HEADER_KEY}`, sessionIdHeader);

  if (typeof sessionIdHeader === 'string' && sessionIdHeader !== 'undefined') {
    return sessionIdHeader;
  }
  return undefined;
};

export const getSessionIdFromCookie = (req: SystemHttpRequestType<UserSessionData>): SessionId | string | undefined => {
  const cookies = req.cookies;
  const cookieValue = cookies?.sessionId === 'undefined' ? undefined : cookies?.sessionId;
  if (cookieValue) {
    console.debug(getSessionIdFromCookie, `Got a cookie session Id with value ${cookieValue}`);
  } else {
    console.debug(getSessionIdFromCookie, 'No cookie session Id found on request');
  }
  return cookieValue;
};

export const requestHasSessionId = (req: SystemHttpRequestType<UserSessionData>): boolean => {
  return !!getSessionIdFromRequestHeader(req) || !!getSessionIdFromCookie(req);
};

// prettier-ignore
export const sessionV2IdFromRequest = <
  RequestType extends SystemHttpRequestType<DataType>,
  DataType extends UserSessionData = UserSessionData,
  >(
    req: RequestType
  ): string => {
  const generatedId = uuidv4();
  req.newSessionIdGenerated = true;
  return generatedId;
};

// prettier-ignore
export const sessionV1IdFromRequest = <
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

  const sessionIdFromRequest: string | undefined = getSessionIdFromRequestHeader(req);
  if (sessionIdFromRequest) {
    req.newSessionIdGenerated = false;
    return sessionIdFromRequest;
  }

  if (req.session?.id) {
    req.newSessionIdGenerated = false;
    return req.session.id;
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
  useSessionStore: expressSession.Store = memoryStore,
  genIdFunction: (_req: SystemHttpRequestType<UserSessionData>) => string = sessionV2IdFromRequest
): expressSession.SessionOptions => {
  const defaults: expressSession.SessionOptions = {
    genid: genIdFunction,
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
  options?: Partial<UserSessionOptions> | Partial<expressSession.SessionOptions> | undefined,
  useSessionStore: expressSession.Store = memoryStore
): RequestHandler => {
  let genIdFunction = sessionV2IdFromRequest;
  if ((options as Partial<UserSessionOptions>)?.usmVersion === 1) {
    genIdFunction = sessionV1IdFromRequest;
  }
  let sessionOptions = defaultExpressSessionOptions(options, useSessionStore, genIdFunction);
  sessionOptions = defaultUserSessionOptions(sessionOptions);
  console.info(`Session header will look for ${sessionOptions.name}`);
  return session(sessionOptions);
};
