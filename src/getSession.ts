import { SessionId, SystemHttpRequestType, SystemSessionDataType, UserSessionOptions } from './types.js';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { IncomingHttpHeaders } from 'http';
import expressSession from 'express-session';
import { loadEnv } from '@tjsr/simple-env-utils';
import session from 'express-session';

const memoryStore = new session.MemoryStore();

loadEnv();
const IN_PROD = process.env['NODE_ENV'] === 'production';
const TWO_HOURS = 1000 * 60 * 60 * 2;
const TWENTYFOUR_HOURS = 1000 * 60 * 60 * 24;
export const SESSION_ID_HEADER_KEY = 'x-session-id';
const SESSION_SECRET = process.env['SESSION_ID_SECRET'] || uuidv4();

const getSessionIdFromRequestHeader = (req: SystemHttpRequestType<SystemSessionDataType>): string | undefined => {
  const headers: IncomingHttpHeaders = req.headers;
  const sessionIdHeader: SessionId | string | string[] | undefined =
    headers[SESSION_ID_HEADER_KEY];

  if (typeof sessionIdHeader === 'string' && sessionIdHeader !== 'undefined') {
    return sessionIdHeader;
  }
  return undefined;
};

const getSessionIdFromCookie = (req: SystemHttpRequestType<SystemSessionDataType>): SessionId | string | undefined => {
  const cookies = req.cookies;
  const cookieValue = cookies?.sessionId === 'undefined' ? undefined : cookies?.sessionId;
  return cookieValue;
};

export const generateNewSessionId = (sessionSecret = SESSION_SECRET): SessionId => {
  return uuidv5(uuidv4(), sessionSecret);
};

export const sessionIdFromRequest = <
  RequestType extends SystemHttpRequestType<DataType>,
  DataType extends SystemSessionDataType
>(req: RequestType): string => {
  if (req.regenerateSessionId) {
    const generatedId = uuidv4();
    req.newSessionIdGenerated = true;
    return generatedId;
  }

  const sessionIdFromRequest: string|undefined = getSessionIdFromRequestHeader(req);
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

export const defaultExpressSessionOptions = (options?: Partial<expressSession.SessionOptions> | undefined,
  useSessionStore: expressSession.Store = memoryStore
): expressSession.SessionOptions => {
  const defaults: expressSession.SessionOptions = {
    genid: sessionIdFromRequest,
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

// type TempHandler = RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;

// ,
  // useSessionStore: Store = memoryStore
export const expressSessionHandlerMiddleware = (
  options: Partial<expressSession.SessionOptions> | undefined
) => {
  let sessionOptions: expressSession.SessionOptions = defaultExpressSessionOptions(options);
  sessionOptions = defaultUserSessionOptions(sessionOptions);
  return session(sessionOptions);
};
