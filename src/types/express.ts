// import * as express from 'express';
import * as session from 'express-session';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmailAddress, HandlerName, UserId } from "../types.js";
import { UserSessionData, UserSessionDataFields } from "./session.js";

import { SystemResponseLocals } from "./locals.js";

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

declare module "express-session" { 
  interface SessionData {
    userId: UserId;
    email: EmailAddress;
    newId: boolean | undefined;
  }
  
  // interface Session extends Partial<SessionData> {}
  interface Session extends UserSessionData {}

  // interface Session {
  //   // sessionID: string;
  //   userId: UserId | undefined;
  //   email: EmailAddress | undefined;
  //   newId: boolean | undefined;
  // }
}

export type { ErrorRequestHandler, Request, RequestHandler, Response, NextFunction  } from 'express';
export type { Session, SessionData } from 'express-session';

