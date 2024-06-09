import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponseType, SystemSessionDataType } from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";
import express, { NextFunction } from "express";
import {
  handleExistingSessionWithNoSessionData,
  handleNewSessionWithNoSessionData
} from './handleSessionWithNoData.js';
import {
  requireSessionIdGenerated,
  requireSessionIdWhenNewSessionIdGenerated,
  requireSessionInitialized,
} from '../errors/sessionErrorChecks.js';

export const handleSessionIdRequired = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends SystemHttpResponseType<SessionStoreDataType>
>(
    request: RequestType,
    response: ResponseType,
    handleSessionWithNewlyGeneratedId: NextFunction
  ): void => {
  addCalledHandler(response, handleSessionIdRequired.name);
  try {
    requireSessionIdGenerated(request.sessionID);
  } catch (sessionError) {
    handleSessionWithNewlyGeneratedId(sessionError);
    return;
  }
  handleSessionWithNewlyGeneratedId();
};

export const handleSessionWithNewlyGeneratedId = <
RequestType extends SystemHttpRequestType<SystemSessionDataType>,
ResponseType extends SystemHttpResponseType<SessionStoreDataType>
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

export const checkNewlyGeneratedId = <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
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

export const handleSessionIdAfterDataRetrieval = <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>,
  response: express.Response,
  next: express.NextFunction // handleCopySessionStoreDataToSession
): void => {
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
