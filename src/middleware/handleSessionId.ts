import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";
import express, { NextFunction } from "express";
import {
  requireSessionIdGenerated,
  requireSessionIdWhenNewSessionIdGenerated,
  requireSessionInitialized,
} from '../sessionHandlerErrors.js';

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
  handleRetrievedSessionDataOrErrorHandler: express.NextFunction
): boolean => {
  try {
    requireSessionIdWhenNewSessionIdGenerated(req.sessionID, req.newSessionIdGenerated);
  } catch (sessionErr) {
    handleRetrievedSessionDataOrErrorHandler(sessionErr);
    return true;
  }
  if (req.newSessionIdGenerated) {
    handleRetrievedSessionDataOrErrorHandler();
    return true;
  }
  return false;
};

export const handleSessionIdAfterDataRetrieval = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  _res: express.Response,
  next: express.NextFunction // handleCopySessionStoreDataToSession
): void => {
  try {
    requireSessionIdGenerated(req.sessionID);
    next();
  } catch (err) {
    next(err);
  }
};
