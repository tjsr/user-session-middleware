import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";

import { addCalledHandler } from './handlerChainLog.js';
import express from "express";
import { requireSessionStoreConfigured } from "../errors/sessionErrorChecks.js";

export const handleSessionStoreRequired = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>
>(
    request: RequestType,
    response: express.Response,
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
