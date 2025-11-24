import { SystemResponseLocals } from "../types/locals.js";
import { UserSessionData } from "../types/session.js";
import express from 'express';
import session from 'express-session';

declare module 'express' {
  interface Request {
    newSessionIdGenerated?: boolean;
    regenerateSessionId?: boolean;
    session: session.Session & UserSessionData;
  }

  interface Response {
    locals: SystemResponseLocals<UserSessionData>;
    sendfile?: (path: string, options?: object, callback?: (err: Error) => void) => void;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface NextFunction {}
}

export type AppLocals = express.Application['locals'];

export default express;

// prettier-ignore
export type {
  Application,
  ErrorRequestHandler,
  Express,
  Handler,
  Request,
  RequestHandler,
  Response,
  NextFunction
} from 'express';
