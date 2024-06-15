import { SystemResponseLocals } from "../types/locals.js";
import { UserSessionData } from "../types/session.js";
import express from 'express';
import session from 'express-session';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "express" {
  interface Request {
    session: session.Session & UserSessionData;
    // session: session.Session & Partial<UserSessionData>;
    // session: session.Session & Partial<UserSessionData>;
  }
  
  interface Response {
    locals: SystemResponseLocals<UserSessionData>;
  }
  
  interface NextFunction {
    
  }
}

export default express;

export type { ErrorRequestHandler, Express, Request, RequestHandler, Response, NextFunction  } from 'express';
