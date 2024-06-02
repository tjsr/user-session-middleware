import {
  ERROR_RETRIEVING_SESSION_DATA,
  ERROR_SAVING_SESSION,
  ERROR_SESSION_ID_WITH_NO_DATA
} from "../errors/errorCodes.js";
import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "../types.js";
import { addCalledHandler, verifyCorequisiteHandler, verifyPrerequisiteHandler } from './handlerChainLog.js';
import { checkNewlyGeneratedId, handleSessionIdRequired } from './handleSessionId.js';
import { retrieveSessionDataFromStore, saveSessionDataToSession } from '../store/loadData.js';

import { HttpStatusCode } from "../httpStatusCodes.js";
import { NoSessionDataFoundError } from "../errors/errorClasses.js";
import { SessionHandlerError } from '../errors/SessionHandlerError.js';
import express from "express";
import {
  regenerateSessionIdIfNoSessionData,
} from "../sessionChecks.js";
import {
  requireSessionStoreConfigured,
} from '../errors/sessionErrorChecks.js';
import { saveSessionPromise } from "../sessionUser.js";

export const handleSessionDataRetrieval = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionCookie
): void => {
  addCalledHandler(response, handleSessionDataRetrieval.name);
  try {
    requireSessionStoreConfigured(req.sessionStore);
  } catch (err) {
    next(err);
    return;
  }

  verifyPrerequisiteHandler(response, handleSessionIdRequired.name);
  
  if (checkNewlyGeneratedId(req, next)) {
    return;
  }

  // let genericSessionData: ApplicationDataType|null|undefined;
  // genericSessionData = await retrieveSessionDataFromStore<ApplicationDataType>(req.sessionStore, req.sessionID!);
  retrieveSessionDataFromStore<ApplicationDataType>(req.sessionStore, req.sessionID!).then((genericSessionData) => {
    console.log(handleSessionDataRetrieval, `Successfully retrieved session ${req.sessionID} data from store.`);
    response.locals.retrievedSessionData = genericSessionData as ApplicationDataType;
    next();
  }).catch((err) => {
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_RETRIEVING_SESSION_DATA,
      500,
      'Error getting session data from data store.',
      err);
    next(sessionError);
  });

  // response.locals.retrievedSessionData = genericSessionData as ApplicationDataType;
  // next();
};

export const handleNewSessionWithNoSessionData = <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionsWithRequiredData
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

export const handleExistingSessionWithNoSessionData = <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionsWithRequiredData
): void => {
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

  const sessionData: ApplicationDataType = response.locals?.retrievedSessionData as ApplicationDataType;
  try {
    const originalSessionId = request.sessionID;
    const newSessionId = regenerateSessionIdIfNoSessionData(sessionData, request);
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
  } catch (err) {
    console.error(handleExistingSessionWithNoSessionData, 'Failed while saving session wrapped as promise.', err);
    next(err);
    return;
  }
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

// // Throw an exception if a session that expects the retrievedSessionData was populated from the store.
// export const handleSessionsWhichRequiredData = <ApplicationDataType extends SystemSessionDataType>(
//   request: SystemHttpRequestType<ApplicationDataType>,
//   response: SystemHttpResponse<SessionStoreDataType>,
//   next: express.NextFunction // handleSessionIdAfterDataRetrieval
// ): void => {
//   addCalledHandler(response, handleSessionsWhichRequiredData.name);
//   verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);
//   verifyPrerequisiteHandler(response, handleCopySessionStoreDataToSession.name);

//   // Newly generated session IDs should not have any data in the store so shouldn't be required.
//   if (checkNewlyGeneratedId(request, next)) {
//     return;
//   }

//   assert(response.locals.retrievedSessionData, 'No session data retrieved.');
//   const sessionData: SessionStoreDataType = response.locals.retrievedSessionData as SessionStoreDataType;
//   try {
//     requireSessionDataForExistingId(request.newSessionIdGenerated, sessionData);
//     next();
//   } catch (err) {
//     console.error(handleSessionsWhichRequiredData, response.statusCode,
//       err, `Received sessionID ${request.sessionID} but no session data.`);
//     next(err);
//   }
// };

export const handleCopySessionStoreDataToSession = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
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
  saveSessionDataToSession(sessionData, req.session).then(() => {
    next();
  }).catch((err) => {
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_SAVING_SESSION, 500,
      'Error while saving session data to store after writing store data to session', err);
    next(sessionError);
  });
  // return Promise.resolve();
};
