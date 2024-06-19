import { addCalledHandler, verifyPrerequisiteHandler } from '../handlerChainLog.js';
import { checkNewlyGeneratedId, handleSessionIdRequired } from '../handleSessionId.js';

import { ERROR_RETRIEVING_SESSION_DATA } from "../../errors/errorCodes.js";
import { SessionHandlerError } from '../../errors/SessionHandlerError.js';
import { SystemHttpRequestType } from '../../types/request.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import express from "../../express/index.js";
import { handleLocalsCreation } from "../handleLocalsCreation.js";
import { requireSessionStoreConfigured } from '../../errors/sessionErrorChecks.js';
import { retrieveSessionDataFromStore } from '../../store/loadData.js';

export const handleSessionDataRetrieval: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next: express.NextFunction
): void => {
  addCalledHandler(response, handleSessionDataRetrieval.name);
  try {
    verifyPrerequisiteHandler(response, handleLocalsCreation.name);
    requireSessionStoreConfigured(request.sessionStore, response.locals.calledHandlers!);
  } catch (err) {
    next(err);
    return;
  }

  verifyPrerequisiteHandler(response, handleSessionIdRequired.name);

  if (checkNewlyGeneratedId(request as SystemHttpRequestType, next)) {
    return;
  }

  retrieveSessionDataFromStore(
    request.sessionStore, request.sessionID!).then((genericSessionData) => {
    if (genericSessionData) {
      console.log(handleSessionDataRetrieval, `Successfully retrieved session ${request.sessionID} data from store.`);
      // TODO: Fix typings here, Cookie gets returned from store retrieval .get() method.
      response.locals.retrievedSessionData = genericSessionData;
    }
    next();
  }).catch((err) => {
    // TODO: Specific error class for this case.
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_RETRIEVING_SESSION_DATA,
      500,
      'Error getting session data from data store.',
      err);
    next(sessionError);
  });
};
