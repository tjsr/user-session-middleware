import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.js";
import { addCalledHandler, assertPrerequisiteHandler } from "./handlerChainLog.js";
import { handleSessionCookie, handleSessionCookieOnError } from "./handlers/index.js";

import { HttpStatusCode } from "../httpStatusCodes.js";
import { NextFunction } from "../express/index.js";
import { SystemHttpRequestType } from "../types/request.js";
import { SystemHttpResponseType } from "../types/response.js";

export const endRequest: UserSessionMiddlewareRequestHandler = (
  _req: SystemHttpRequestType,
  response: SystemHttpResponseType,
  _next: NextFunction
):void => {
  addCalledHandler(response, endRequest);
  assertPrerequisiteHandler(response, handleSessionCookie);
  response.send();
  response.end();
};

export const endErrorRequest: UserSessionMiddlewareErrorHandler = (
  err: Error,
  _req: SystemHttpRequestType,
  response: SystemHttpResponseType,
  _next: NextFunction
) => {
  addCalledHandler(response, endErrorRequest);
  console.warn(endErrorRequest, 'Got end error request', err, response.statusCode);
  try {
    assertPrerequisiteHandler(response, handleSessionCookieOnError);
    response.sendStatus(response.statusCode);
  } catch (err) {
    response.sendStatus(HttpStatusCode.NOT_IMPLEMENTED);
  }
  response.end();
};
