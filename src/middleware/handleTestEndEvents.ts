import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";
import { handleSessionCookie, handleSessionCookieOnError } from "./handlers/handleSessionCookie.js";

import { HttpStatusCode } from "../httpStatusCodes.js";
import { NextFunction } from "express";
import { SystemHttpRequestType } from "../types/request.js";
import { SystemHttpResponseType } from "../types/response.js";

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
