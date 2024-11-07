import { SystemResponseLocals } from '../types/locals.js';
import { USER_ID_NAMESPACE_KEY } from '../auth/userNamespace.js';
import { UserSessionData } from '../types/session.js';
import { UserSessionOptions } from '../types/sessionOptions.js';
import express from 'express';
import session from 'express-session';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AppLocals extends Record<string, unknown> {
  debugCallHandlers?: boolean;
  sessionConfig?: Partial<UserSessionOptions>;
  sessionIdCookieKey?: string;
  sessionIdHeaderKey?: string;
  [USER_ID_NAMESPACE_KEY]?: string;
}

declare module 'express' {
  interface Request {
    newSessionIdGenerated?: boolean;
    regenerateSessionId?: boolean;
    session: session.Session & UserSessionData;
  }

  interface Locals {
    newSessionIdGenerated?: boolean;
    regenerateSessionId?: boolean;
  }

  interface Response {
    locals: SystemResponseLocals<UserSessionData>;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface NextFunction {}

  interface Application<TAppLocals = AppLocals> {
    locals: TAppLocals;
    // {
    //   sessionConfig?: Partial<UserSessionOptions> | undefined;
    //   sessionIdCookieKey?: string | undefined;
    //   sessionIdHeaderKey?: string | undefined;
    //   [USER_ID_NAMESPACE_KEY]?: string;
    // };
  }
}

export default express;

export type {
  ErrorRequestHandler,
  Express,
  Handler,
  Request,
  RequestHandler,
  Response,
  Locals,
  // eslint-disable-next-line @stylistic/js/comma-dangle
  NextFunction,
} from 'express';
