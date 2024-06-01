import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";
import express, { NextFunction } from "express";
import {
  requireSessionIdGenerated,
  requireSessionIdWhenNewSessionIdGenerated,
  requireSessionInitialized,
} from '../errors/sessionErrorChecks.js';

import { handleSessionWithNoSessionData } from "./storedSessionData.js";

export const handleSessionIdRequired = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>
>(
    req: RequestType,
    _res: express.Response,
    handleSessionWithNewlyGeneratedId: NextFunction
  ): void => {
  try {
    requireSessionIdGenerated(req.sessionID);
  } catch (sessionError) {
    handleSessionWithNewlyGeneratedId(sessionError);
    return;
  }
  handleSessionWithNewlyGeneratedId();
};

export const handleSessionWithNewlyGeneratedId = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  _res: express.Response,
  handleSessionDataRetrieval: express.NextFunction
) => {
  try {
    requireSessionInitialized(req.session);
  } catch (sessionErr) {
    handleSessionDataRetrieval(sessionErr);
    return;
  };

  if (req.newSessionIdGenerated === true) {
    req.session.save();
  }
  handleSessionDataRetrieval();
};

export const checkNewlyGeneratedId = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  next: express.NextFunction // handleRetrievedSessionDataOrErrorHandler
): boolean => {
  try {
    requireSessionIdWhenNewSessionIdGenerated(req.sessionID, req.newSessionIdGenerated);
  } catch (sessionErr) {
    next(sessionErr);
    return true;
  }
  if (req.newSessionIdGenerated) {
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
  verifyPrerequisiteHandler(response, handleSessionWithNoSessionData.name);

  try {
    requireSessionIdGenerated(request.sessionID);
    next();
  } catch (err) {
    next(err);
  }
};
