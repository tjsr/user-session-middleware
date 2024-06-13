import { UserSessionData, UserSessionDataFields } from "../types/session.js";

import { HandlerName } from "../types.js";
import { SystemResponseLocals } from "../types/locals.js";
/* eslint-disable @typescript-eslint/no-explicit-any */
import session from 'express-session';

export type { ErrorRequestHandler, Request, RequestHandler, Response, NextFunction  } from 'express';

declare module "express" {
  interface Request {
    session: session.Session & UserSessionData;
    // session: session.Session & Partial<UserSessionData>;
    // session: session.Session & Partial<UserSessionData>;
  }

  interface Response {
    locals: {
      calledHandlers: HandlerName[];
      retrievedSessionData: UserSessionDataFields | undefined;
      skipHandlerDependencyChecks: boolean;
    } & Record<string, any> & SystemResponseLocals<UserSessionData>;
  }

  interface NextFunction {

  }
}
