import { addCalledHandler, assertPrerequisiteHandler } from "./handlerChainLog.js";
import { handleSessionCookieOnError, sendAuthResultBody } from "./handlers/index.js";

import { AssertionError } from "node:assert";
import { NextFunction } from "express";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import {
  UserSessionMiddlewareErrorHandler,
} from '../types/middlewareHandlerTypes.js';

export const sessionErrorHandler: UserSessionMiddlewareErrorHandler =
(
  error,
  request,
  response,
  next: NextFunction
) => {
  addCalledHandler(response, sessionErrorHandler);
  assertPrerequisiteHandler(response, handleSessionCookieOnError);

  if (SessionHandlerError.isType(error) || error instanceof SessionHandlerError) {
    if (response.locals.sendAuthenticationResult) {
      response.status(error.status);
      sendAuthResultBody(request.session, response);
    } else {
      const sessionError: SessionHandlerError = error as SessionHandlerError;
      response.status(sessionError.status);
      response.json({ message: sessionError.message });
      console.error(sessionErrorHandler, 'Session error', sessionError);
    }
  } else if (error instanceof AssertionError) {
    console.error(sessionErrorHandler, 'Got assertion error', error);
  } else if (error.name) {
    const errType = error.name + !error.name.includes('Error') ? ' Error' : '';
    const errMsg = error.message ? error.message : '';
    console.warn(sessionErrorHandler, errType, errMsg);
  }
  next(error);
};
