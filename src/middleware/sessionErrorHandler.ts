import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { NextFunction } from "express";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import {
  UserSessionMiddlewareErrorHandler,
} from '../types/middlewareHandlerTypes.js';
import { handleSessionCookieOnError } from "./handlers/handleSessionCookie.js";

export const sessionErrorHandler: UserSessionMiddlewareErrorHandler =
(
  error,
  _request,
  response,
  next: NextFunction
) => {
  addCalledHandler(response, sessionErrorHandler.name);
  verifyPrerequisiteHandler(response, handleSessionCookieOnError.name);

  if (SessionHandlerError.isType(error)) {
    const sessionError: SessionHandlerError = error as SessionHandlerError;
    response.status(sessionError.status);
    response.json({ message: sessionError.message });
  }
  next(error);
};
