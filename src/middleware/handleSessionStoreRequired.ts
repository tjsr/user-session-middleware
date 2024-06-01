import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";

import { addCalledHandler } from './handlerChainLog.js';
import express from "express";
import { requireSessionStoreConfigured } from "../errors/sessionErrorChecks.js";

export const handleSessionStoreRequired = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>
>(
    req: RequestType,
    response: express.Response,
    next: express.NextFunction
  ): void => {
  addCalledHandler(response, handleSessionStoreRequired.name);
  try {
    requireSessionStoreConfigured(req.sessionStore);
  } catch (sessionError) {
    next(sessionError);
    return;
  }
  next();
};
