/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from 'express-serve-static-core';

import {
  ERROR_RETRIEVING_SESSION_DATA,
  ERROR_SAVING_SESSION,
} from "../errors/errorCodes.js";
import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemResponseLocals,
  SystemSessionDataType,
} from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from './handlerChainLog.js';
import { checkNewlyGeneratedId, handleSessionIdRequired } from './handleSessionId.js';
import { retrieveSessionDataFromStore, saveSessionDataToSession } from '../store/loadData.js';

import { SessionHandlerError } from '../errors/SessionHandlerError.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import express from "express";
import {
  requireSessionStoreConfigured,
} from '../errors/sessionErrorChecks.js';

export const handleSessionDataRetrieval: UserSessionMiddlewareRequestHandler =
<
  ApplicationSessionType extends SystemSessionDataType,
  ApplicationStoreType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> | SystemResponseLocals<ApplicationStoreType> =
    Record<string, any> | SystemResponseLocals<ApplicationStoreType>,
  RequestType extends
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<ApplicationStoreType, ResBody, Locals> =
    SystemHttpResponseType<ApplicationStoreType, ResBody, Locals>
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ):void => {
  addCalledHandler(response, handleSessionDataRetrieval.name);
  try {
    requireSessionStoreConfigured(request.sessionStore, response.locals.calledHandlers);
  } catch (err) {
    next(err);
    return;
  }

  verifyPrerequisiteHandler(response, handleSessionIdRequired.name);
  
  if (checkNewlyGeneratedId(request as SystemHttpRequestType, next)) {
    return;
  }

  // let genericSessionData: ApplicationDataType|null|undefined;
  // genericSessionData = await retrieveSessionDataFromStore<ApplicationDataType>(req.sessionStore, req.sessionID!);
  retrieveSessionDataFromStore<ApplicationSessionType>(
    request.sessionStore, request.sessionID!).then((genericSessionData) => {
    if (genericSessionData) {
      console.log(handleSessionDataRetrieval, `Successfully retrieved session ${request.sessionID} data from store.`);
      response.locals.retrievedSessionData = genericSessionData as ApplicationSessionType;
    }
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

export const handleCopySessionStoreDataToSession: UserSessionMiddlewareRequestHandler =
<
  ApplicationSessionType extends SystemSessionDataType,
  ApplicationStoreType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> | SystemResponseLocals<ApplicationStoreType> =
    Record<string, any> | SystemResponseLocals<ApplicationStoreType>,
  RequestType extends
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<ApplicationStoreType, ResBody, Locals> =
    SystemHttpResponseType<ApplicationStoreType, ResBody, Locals>
>(
    request: RequestType,
    response: ResponseType,
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
  // return Promise.resolve();
};
