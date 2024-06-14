import { UserSessionMiddlewareRequestHandler } from "../types/middlewareHandlerTypes.js";
import { addCalledHandler } from './handlerChainLog.js';
import express from "express";
import { requireSessionStoreConfigured } from "../errors/sessionErrorChecks.js";

export const handleSessionStoreRequired: UserSessionMiddlewareRequestHandler = (
  request,
  response,
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
