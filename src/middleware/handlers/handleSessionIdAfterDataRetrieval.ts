import { addCalledHandler, assertPrerequisiteHandler } from "../handlerChainLog.js";

import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import express from "express";
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.js';
import { handleNewSessionWithNoSessionData } from './handleSessionWithNoData.js';
import { requireSessionIdGenerated } from '../../errors/sessionErrorChecks.js';

export const handleSessionIdAfterDataRetrieval: UserSessionMiddlewareRequestHandler =
  (
    request,
    response,
    next: express.NextFunction
  ) => {
    addCalledHandler(response, handleSessionIdAfterDataRetrieval.name);
    assertPrerequisiteHandler(response, handleNewSessionWithNoSessionData.name);
    assertPrerequisiteHandler(response, handleExistingSessionWithNoSessionData.name);

    try {
      requireSessionIdGenerated(request.sessionID);
      next();
    } catch (err) {
      next(err);
    }
  };
