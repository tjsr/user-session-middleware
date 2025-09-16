import { NextFunction } from "express";
import { SystemHttpResponseType } from '../../types/response.ts';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.ts';
import { addCalledHandler } from '../handlerChainLog.js';
import { requireSessionIdGenerated } from '../../errors/sessionErrorChecks.ts';

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
