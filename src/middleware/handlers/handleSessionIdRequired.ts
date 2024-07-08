import { NextFunction } from "express";
import { SystemHttpResponseType } from '../../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { addCalledHandler } from "../handlerChainLog.js";
import { requireSessionIdGenerated } from '../../errors/sessionErrorChecks.js';

export const handleSessionIdRequired: UserSessionMiddlewareRequestHandler =
  (
    request,
    response: SystemHttpResponseType,
    handleSessionWithNewlyGeneratedId: NextFunction
  ): void => {
    addCalledHandler(response, handleSessionIdRequired);
    try {
      requireSessionIdGenerated(request.sessionID);
    } catch (sessionError) {
      handleSessionWithNewlyGeneratedId(sessionError);
      return;
    }
    handleSessionWithNewlyGeneratedId();
  };
