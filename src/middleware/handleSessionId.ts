/* eslint-disable @typescript-eslint/no-explicit-any */

import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";
import {
  requireSessionIdGenerated,
  requireSessionIdWhenNewSessionIdGenerated,
  requireSessionInitialized,
} from '../errors/sessionErrorChecks.js';

import { SystemHttpRequestType } from '../types/request.js';
import { SystemHttpResponseType } from '../types/response.js';
import {
  UserSessionMiddlewareRequestHandler
} from '../types/middlewareHandlerTypes.js';
import express from "express";
import { handleExistingSessionWithNoSessionData } from './handlers/handleExistingSessionWithNoSessionData.js';
import {
  handleNewSessionWithNoSessionData
} from './handleSessionWithNoData.js';

export const handleSessionWithNewlyGeneratedId: UserSessionMiddlewareRequestHandler =
<
RequestType extends SystemHttpRequestType,
ResponseType extends SystemHttpResponseType
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, handleSessionWithNewlyGeneratedId.name);

  try {
    requireSessionInitialized(request.session);
  } catch (sessionErr) {
    console.error(handleSessionWithNewlyGeneratedId, 'request.session was not initialised.', sessionErr);
    next(sessionErr);
    return;
  };

  if (request.newSessionIdGenerated === true) {
    request.session.save((err) => {
      if (err) {
        console.error(handleSessionWithNewlyGeneratedId, 'Error saving session data.', err);
        next(err);
      } else {
        next();
      }
    });
  } else {
    next();
  }
};

export const checkNewlyGeneratedId = (
  request: SystemHttpRequestType,
  next: express.NextFunction // handleRetrievedSessionDataOrErrorHandler
): boolean => {
  try {
    requireSessionIdWhenNewSessionIdGenerated(request.sessionID, request.newSessionIdGenerated);
  } catch (sessionErr) {
    next(sessionErr);
    return true;
  }
  if (request.newSessionIdGenerated) {
    next();
    return true;
  }
  return false;
};

export const handleSessionIdAfterDataRetrieval: UserSessionMiddlewareRequestHandler =
// <
//   SessionType extends SystemSessionDataType,
//   StoreType extends SessionStoreDataType,
//   P = core.ParamsDictionary,
//   ResBody = any,
//   ReqBody = any,
//   ReqQuery = core.Query,
//   Locals extends SystemResponseLocals<StoreType> = SystemResponseLocals<StoreType>,
//   RequestType extends express.Request = 
//     SystemHttpRequestType<SessionType, StoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
//   ResponseType extends SystemHttpResponseType<StoreType, ResBody, Locals> =
//     SystemHttpResponseType<StoreType, ResBody, Locals>
// >
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
