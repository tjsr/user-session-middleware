import * as express from '../express/index.js';

import { addCalledHandler, verifyCorequisiteHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { ERROR_SESSION_ID_WITH_NO_DATA } from "../errors/errorCodes.js";
import { HttpStatusCode } from "../httpStatusCodes.js";
import { NoSessionDataFoundError } from "../errors/errorClasses.js";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import {
  SessionId,
} from "../types.js";
import { SystemHttpRequestType } from "../types/request.js";
import { SystemHttpResponseType } from '../types/response.js';
import { UserSessionData } from "../types/session.js";
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import { handleSessionDataRetrieval } from "./storedSessionData.js";
import { regenerateSessionIdIfNoSessionData } from "../sessionChecks.js";
import { saveSessionPromise } from "../sessionUser.js";

export const handleNewSessionWithNoSessionData: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
  >(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ): void => {
  addCalledHandler(response, handleNewSessionWithNoSessionData.name);
  // This must be called *before* handleExistingSessionWithNoSessionData because it sets newSessionIdGenerated
  verifyCorequisiteHandler(response, handleExistingSessionWithNoSessionData.name);
  if (request.newSessionIdGenerated !== true) {
    console.debug(handleNewSessionWithNoSessionData, 'Skipping because using provided sessionID.');
    next();
    return;
  }

  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);

  if (response.locals?.retrievedSessionData) {
    console.debug(handleNewSessionWithNoSessionData, 'Skipping because sessionData was retrieved.');
    // This will actually be an error state, but we'll handle it in its own handler.
    next();
    return;
  }

  // Then save the session data to the session store.
  saveSessionPromise(request.session).then(() => {
    // Finally, send us to the error handler
    // Essentially this is requireSessionDataForExistingId
    next();
  }).catch((err) => {
    console.error(handleNewSessionWithNoSessionData, 'promiseReject',
      'Failed while saving session wrapped as promise.', err);
    next(err);
  });
  // await saveSessionPromise(request.session);
};

export const handleExistingSessionWithNoSessionData: UserSessionMiddlewareRequestHandler = <
  SessionDataType extends UserSessionData,
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ):void => {
  addCalledHandler(response, handleExistingSessionWithNoSessionData.name);
  if (request.newSessionIdGenerated === true) {
    console.debug(handleExistingSessionWithNoSessionData, 'Skipping because new sessionID generated.');
    next();
    return;
  }
  
  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);
  verifyPrerequisiteHandler(response, handleNewSessionWithNoSessionData.name);

  if (response.locals?.retrievedSessionData) {
    console.debug(handleExistingSessionWithNoSessionData, 'Skipping because sessionData was retrieved.');
    next();
    return;
  }
  console.debug(handleExistingSessionWithNoSessionData, 'Continuing to regenerateSessionIdIfNoSessionData');

  const sessionData: SessionDataType = response.locals?.retrievedSessionData as SessionDataType;
  try {
    const originalSessionId = request.sessionID;
    regenerateSessionIdIfNoSessionData(sessionData, request).then((newSessionId: SessionId | undefined) => {
      let error: SessionHandlerError;
      if (newSessionId) {
        error = new NoSessionDataFoundError(originalSessionId, newSessionId);
        console.debug(handleSessionDataRetrieval, `New sessionId ${newSessionId} assigned.`);
      } else {
        error = new SessionHandlerError(ERROR_SESSION_ID_WITH_NO_DATA, HttpStatusCode.INTERNAL_SERVER_ERROR,
          'Unknown state: no new sessionId generated and no session data found.');
      }
      // await saveSessionPromise(request.session);
      saveSessionPromise(request.session).then(() => {
        // Finally, send us to the error handler
        // Essentially this is requireSessionDataForExistingId
        next(error);
        return;
      }).catch((err) => {
        console.error(handleExistingSessionWithNoSessionData, 'promiseReject',
          'Failed while saving session wrapped as promise.', err);
        next(err);
      });
    }).catch((err) => {
      console.error(handleExistingSessionWithNoSessionData, 'Failed while regenerating session ID.', err);
      next(err);
    });
    
  } catch (err) {
    console.error(handleExistingSessionWithNoSessionData, 'Failed while saving session wrapped as promise.', err);
    next(err);
    return;
  }
};
