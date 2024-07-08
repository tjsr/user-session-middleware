import { addCalledHandler, assertPrerequisiteHandler } from '../handlerChainLog.js';
import { requireHandlerChainCreated, requireSessionStoreConfigured } from "../../errors/sessionErrorChecks.js";

import { UserSessionMiddlewareRequestHandler } from "../../types/middlewareHandlerTypes.js";
import express from "express";
import { handleLocalsCreation } from './handleLocalsCreation.js';

export const handleSessionStoreRequired: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next: express.NextFunction
): void => {
  addCalledHandler(response, handleSessionStoreRequired.name);
  assertPrerequisiteHandler(response, handleLocalsCreation.name);
  try {
    requireHandlerChainCreated(response.locals);
    requireSessionStoreConfigured(request.sessionStore, response.locals.calledHandlers!);
  } catch (sessionError) {
    next(sessionError);
    return;
  }
  next();
};
