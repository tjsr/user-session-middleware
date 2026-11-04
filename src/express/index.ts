import express from 'express';
import session from 'express-session';

import { SystemResponseLocals } from '../types/locals.ts';
import { UserSessionData } from '../types/session.ts';

declare module 'express' {
  interface Request {
    newSessionIdGenerated?: boolean;
    regenerateSessionId?: boolean;
    session: session.Session & UserSessionData;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface NextFunction {}
}

// Add middleware fields to Express's shared locals rather than replacing the
// generic Response.locals type used by applications.
declare module 'express-serve-static-core' {
  interface Locals extends SystemResponseLocals<UserSessionData> {}
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
