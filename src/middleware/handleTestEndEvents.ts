import { SystemHttpRequestType, SystemHttpResponseType } from "../types.ts";
import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.ts";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.ts";
import { handleSessionCookie, handleSessionCookieOnError } from "./handleSessionCookie.ts";

import { HttpStatusCode } from "../httpStatusCodes.ts";
import { NextFunction } from "express";

export const endRequest: UserSessionMiddlewareRequestHandler = (
  _req: SystemHttpRequestType,
  response: SystemHttpResponseType,
  _next: NextFunction
):void => {
  addCalledHandler(response, endRequest.name);
  verifyPrerequisiteHandler(response, handleSessionCookie.name);
  response.send();
  response.end();
};

export const endErrorRequest: UserSessionMiddlewareErrorHandler = (
  err: Error,
  _req: SystemHttpRequestType,
  response: SystemHttpResponseType,
  _next: NextFunction
) => {
  addCalledHandler(response, endErrorRequest.name);
  console.warn(endErrorRequest, 'Got end error request', err, response.statusCode);
  try {
    verifyPrerequisiteHandler(response, handleSessionCookieOnError.name);
    response.sendStatus(response.statusCode);
  } catch (err) {
    response.sendStatus(HttpStatusCode.NOT_IMPLEMENTED);
  }
  response.end();
};
