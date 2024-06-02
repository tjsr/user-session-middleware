import { SystemHttpRequestType, SystemSessionDataType } from "../types";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import express from "express";
import { handleSessionCookieOnError } from "./handleSessionCookie.js";

export const sessionErrorHandler = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
    err: Error,
    req: RequestType,
    response: express.Response,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, sessionErrorHandler.name);
  verifyPrerequisiteHandler(response, handleSessionCookieOnError.name);

  if (SessionHandlerError.isType(err)) {
    const sessionError: SessionHandlerError = err as SessionHandlerError;
    response.status(sessionError.status);
    response.json({ message: sessionError.message });
    next(err);
    return;
  }
  if (response.statusCode <= 200) {
    console.error(err, 'Error with res.statusCode < 200 - this test should fail.');
    response.status(500);
  }
  next(err);
};
