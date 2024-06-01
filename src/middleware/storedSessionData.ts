import { ERROR_RETRIEVING_SESSION_DATA, ERROR_SAVING_SESSION } from "../errors/errorCodes.js";
import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "../types.js";
import { addCalledHandler, verifyCorequisiteHandler, verifyPrerequisiteHandler } from './handlerChainLog.js';
import { checkNewlyGeneratedId, handleSessionIdRequired } from './handleSessionId.js';
import {
  requireSessionDataForExistingId,
  requireSessionStoreConfigured,
} from '../errors/sessionErrorChecks.js';
import { retrieveSessionDataFromStore, saveSessionDataToSession } from '../store/loadData.js';

import { NoSessionDataFoundError } from "../errors/errorClasses.js";
import { SessionHandlerError } from '../errors/SessionHandlerError.js';
import assert from "assert";
import express from "express";
import {
  regenerateSessionIdIfNoSessionData,
} from "../sessionChecks.js";
import { saveSessionPromise } from "../sessionUser.js";

export const handleSessionDataRetrieval = async <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionCookie
): Promise<void> => {
  addCalledHandler(response, handleSessionDataRetrieval.name);
  try {
    requireSessionStoreConfigured(req.sessionStore);
  } catch (err) {
    next(err);
    return Promise.resolve();
  }

  verifyCorequisiteHandler(response, handleSessionIdRequired.name);
  
  if (checkNewlyGeneratedId(req, next)) {
    return;
  }

  let genericSessionData: ApplicationDataType|null|undefined;
  try {
    genericSessionData = await retrieveSessionDataFromStore<ApplicationDataType>(req.sessionStore, req.sessionID!);
    console.log(handleSessionDataRetrieval, `Successfully retrieved session ${req.sessionID} data from store.`);
  } catch (cause) {
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_RETRIEVING_SESSION_DATA,
      500,
      'Error getting session data from data store.',
      cause);
    next(sessionError);
    return;
  }

  response.locals.retrievedSessionData = genericSessionData as ApplicationDataType;
  next();
};

export const handleNewSessionWithNoSessionData = async <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionsWithRequiredData
): Promise<void> => {
  addCalledHandler(response, handleNewSessionWithNoSessionData.name);
  // This must be called *before* handleExistingSessionWithNoSessionData because it sets newSessionIdGenerated
  verifyCorequisiteHandler(response, handleExistingSessionWithNoSessionData.name);
  if (request.newSessionIdGenerated !== true) {
    next();
    return;
  }

  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);

  if (response.locals?.retrievedSessionData) {
    // This will actually be an error state, but we'll handle it in its own handler.
    next();
    return;
  }

  // Then save the session data to the session store.
  await saveSessionPromise(request.session);
};

export const handleExistingSessionWithNoSessionData = async <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionsWithRequiredData
): Promise<void> => {
  addCalledHandler(response, handleExistingSessionWithNoSessionData.name);
  if (request.newSessionIdGenerated === true) {
    next();
    return;
  }
  
  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);
  verifyPrerequisiteHandler(response, handleNewSessionWithNoSessionData.name);

  if (response.locals?.retrievedSessionData) {
    next();
    return;
  }

  const sessionData: ApplicationDataType = response.locals?.retrievedSessionData as ApplicationDataType;
  try {
    const newSessionId = regenerateSessionIdIfNoSessionData(sessionData, request);
    if (newSessionId) {
      console.debug(handleSessionDataRetrieval, `New sessionId ${newSessionId} assigned.`);
    }
    await saveSessionPromise(request.session);
  } catch (err) {
    next(err);
    return;
  }

  // Finally, send us to the error handler
  // Essentially this is requireSessionDataForExistingId
  const noSessionDataError = new NoSessionDataFoundError();
  next(noSessionDataError);
  return;
};

// export const handleSessionWithNoSessionData = <ApplicationDataType extends SystemSessionDataType>(
//   request: SystemHttpRequestType<ApplicationDataType>,
//   response: SystemHttpResponse<SessionStoreDataType>,
//   next: express.NextFunction // handleSessionsWithRequiredData
// ): void => {
//   addCalledHandler(response, handleSessionWithNoSessionData.name);
//   verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);

//   // Regenerate the sessionID if there was no session data retrieved for an existing sessionID.
//   if (request.newSessionIdGenerated !== true) {
//   }

//   // Then, if there actually was no session data, throw an error AFTER we re-generate the sessionID so it
//   // doesn't happen on the next call.  The next call should have newSessionIdGenerated=true when it
//   // generates a new sessionID
//   try {
//     requireNoSessionDataForNewlyGeneratedId(request.newSessionIdGenerated, sessionData);
//     if (!request.newSessionIdGenerated) {
//       console.warn(handleSessionWithNoSessionData,
//         'This should get handled in handleSessionsWhichRequiredData already');
//     }
//     requireSessionDataForExistingId(request.newSessionIdGenerated, sessionData);
//     next();
//   } catch (err) {
//     next(err);
//   }
// };

// Throw an exception if a session that expects the retrievedSessionData was populated from the store.
export const handleSessionsWhichRequiredData = <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionIdAfterDataRetrieval
): void => {
  addCalledHandler(response, handleSessionsWhichRequiredData.name);
  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);
  verifyPrerequisiteHandler(response, handleCopySessionStoreDataToSession.name);

  // Newly generated session IDs should not have any data in the store so shouldn't be required.
  if (checkNewlyGeneratedId(request, next)) {
    return;
  }

  assert(response.locals.retrievedSessionData, 'No session data retrieved.');
  const sessionData: SessionStoreDataType = response.locals.retrievedSessionData as SessionStoreDataType;
  try {
    requireSessionDataForExistingId(request.newSessionIdGenerated, sessionData);
    next();
  } catch (err) {
    console.error(handleSessionsWhichRequiredData, response.statusCode,
      err, `Received sessionID ${request.sessionID} but no session data.`);
    next(err);
  }
};

export const handleCopySessionStoreDataToSession = async <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleAssignUserIdToRequestSessionWhenNoExistingSessionData
): Promise<void> => {
  try {
    addCalledHandler(response, handleCopySessionStoreDataToSession.name);
    verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);
  } catch (err) {
    next(err);
    return Promise.resolve();
  }

  try {
    const sessionData: SessionStoreDataType = response.locals.retrievedSessionData as SessionStoreDataType;
    await saveSessionDataToSession(sessionData, req.session);
    next();
  } catch (err) {
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_SAVING_SESSION, 500,
      'Error while saving session data to store after writing store data to session', err);
    next(sessionError);
  }
  return Promise.resolve();
};
