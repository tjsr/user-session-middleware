import { addCalledHandler, assertPrerequisiteHandler } from "../handlerChainLog.js";

import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.ts';
import express from 'express';
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.ts';
import { requireSessionIdGenerated } from '../../errors/sessionErrorChecks.ts';

export const handleSessionIdAfterDataRetrieval: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleSessionIdAfterDataRetrieval);
  // assertPrerequisiteHandler(response, handleNewSessionWithNoSessionData);
  assertPrerequisiteHandler(response, handleExistingSessionWithNoSessionData);

  try {
    requireSessionIdGenerated(request.sessionID);
    next();
  } catch (err) {
    next(err);
  }
};
