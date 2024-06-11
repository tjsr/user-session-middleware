import { SystemHttpRequestType, SystemHttpResponseType, SystemSessionDataType } from "../types.js";

import { UserSessionMiddlewareRequestHandler } from "../types/middlewareHandlerTypes.js";
import { addCalledHandler } from './handlerChainLog.js';
import express from "express";
import { requireSessionStoreConfigured } from "../errors/sessionErrorChecks.js";

export const handleSessionStoreRequired: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends SystemHttpResponseType<SystemSessionDataType>
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ): void => {
  addCalledHandler(response, handleSessionStoreRequired.name);
  try {
    requireSessionStoreConfigured(request.sessionStore, response.locals.calledHandlers);
  } catch (sessionError) {
    next(sessionError);
    return;
  }
  next();
};
