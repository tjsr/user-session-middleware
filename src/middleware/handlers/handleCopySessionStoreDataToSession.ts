import { addCalledHandler, verifyPrerequisiteHandler } from '../handlerChainLog.js';

import { ERROR_SAVING_SESSION } from "../../errors/errorCodes.js";
import { SessionHandlerError } from '../../errors/SessionHandlerError.js';
import { SessionStoreDataType } from '../../types/session.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import express from "../../express/index.js";
import { handleSessionDataRetrieval } from "./handleSessionDataRetrieval.js";
import { saveSessionDataToSession } from '../../store/loadData.js';

export const handleCopySessionStoreDataToSession: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next: express.NextFunction // handleAssignUserIdToRequestSessionWhenNoExistingSessionData
): void => {
  try {
    addCalledHandler(response, handleCopySessionStoreDataToSession.name);
    verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);
  } catch (err) {
    next(err);
    return;
  }

  const sessionData: SessionStoreDataType = response.locals.retrievedSessionData as SessionStoreDataType;
  saveSessionDataToSession(sessionData, request.session).then(() => {
    next();
  }).catch((err) => {
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_SAVING_SESSION, 500,
      'Error while saving session data to store after writing store data to session', err);
    next(sessionError);
  });
};
