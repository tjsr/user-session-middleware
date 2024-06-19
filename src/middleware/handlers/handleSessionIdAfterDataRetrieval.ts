import { addCalledHandler, verifyPrerequisiteHandler } from "../handlerChainLog.js";

import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import express from "express";
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.js';
import { handleNewSessionWithNoSessionData } from '../handleSessionWithNoData.js';
import { requireSessionIdGenerated } from '../../errors/sessionErrorChecks.js';

export const handleSessionIdAfterDataRetrieval: UserSessionMiddlewareRequestHandler =
  (
    request,
    response,
    next: express.NextFunction
  ) => {
    addCalledHandler(response, handleSessionIdAfterDataRetrieval.name);
    verifyPrerequisiteHandler(response, handleNewSessionWithNoSessionData.name);
    verifyPrerequisiteHandler(response, handleExistingSessionWithNoSessionData.name);

    try {
      requireSessionIdGenerated(request.sessionID);
      next();
    } catch (err) {
      next(err);
    }
  };
