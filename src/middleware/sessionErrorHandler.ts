import { addCalledHandler, assertPrerequisiteHandler } from "./handlerChainLog.js";

import { NextFunction } from "express";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import {
  UserSessionMiddlewareErrorHandler,
} from '../types/middlewareHandlerTypes.js';
import { handleSessionCookieOnError } from "./handlers/handleSessionCookie.js";
import { sendAuthResultBody } from "./handlers/handleSessionUserBodyResults.js";

export const sessionErrorHandler: UserSessionMiddlewareErrorHandler =
(
  error,
  request,
  response,
  next: NextFunction
) => {
  addCalledHandler(response, sessionErrorHandler.name);
  assertPrerequisiteHandler(response, handleSessionCookieOnError.name);

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
  } else if (error.name) {
    console.warn('Got error of type with name', error.name);
  }
  next(error);
};
