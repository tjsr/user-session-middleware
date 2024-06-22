import * as express from "../express/index.js";

import { AuthenticationError, UnknownAuthenticationError } from "../errors/authenticationErrorClasses.js";

import { SystemResponseLocals } from "../types/locals.js";
import { UserSessionData } from "../types/session.js";

export const passAuthOrUnknownError = <SD extends UserSessionData>(
  locals: SystemResponseLocals<SD>, e: unknown, next: express.NextFunction): void => {
  if (e instanceof AuthenticationError) {
    locals.sendAuthenticationResult = true;
    next(e);
  } else {
    const err: UnknownAuthenticationError = new UnknownAuthenticationError(e);
    console.trace(e);
    next(err);
  }
};
