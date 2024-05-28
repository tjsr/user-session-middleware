import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";
import {
  requireNoSessionDataForNewlyGeneratedId,
  requireSessionDataForExistingId,
} from '../sessionHandlerErrors.js';
import { retrieveSessionDataFromStore, saveSessionDataToSession } from '../store/loadData.js';

import { ERROR_RETRIEVING_SESSION_DATA } from '../errors.js';
import { SessionHandlerError } from '../errors.js';
import assert from "assert";
import { checkNewlyGeneratedId } from './handleSessionId.js';
import express from "express";
import {
  regenerateSessionIdIfNoSessionData,
} from "../sessionChecks.js";

export const handleSessionDataRetrieval = async <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  _res: express.Response,
  next: express.NextFunction // handleSessionCookie
): Promise<void> => {
  if (checkNewlyGeneratedId(req, next)) {
    return;
  }

  let genericSessionData: ApplicationDataType|null|undefined;
  try {
    genericSessionData = await retrieveSessionDataFromStore<ApplicationDataType>(req.sessionStore, req.sessionID!);
  } catch (cause) {
    const sessionError: SessionHandlerError = new SessionHandlerError(
      ERROR_RETRIEVING_SESSION_DATA,
      500,
      'Error getting session data from data store.',
      cause);
    next(sessionError);
    return;
  }

  req.retrievedSessionData = genericSessionData as ApplicationDataType;
  next();
};

export const handleSessionWithNoSessionData = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  _res: express.Response,
  next: express.NextFunction // handleSessionsWithRequiredData
): void => {
  assert(req.retrievedSessionData, 'No session data retrieved.');
  const sessionData: ApplicationDataType = req.retrievedSessionData as ApplicationDataType;
  
  try {
    const newSessionId = regenerateSessionIdIfNoSessionData(sessionData, req);
    if (newSessionId) {
      console.debug(handleSessionDataRetrieval, `New sessionId ${newSessionId} assigned.`);
    }
    requireNoSessionDataForNewlyGeneratedId(req.newSessionIdGenerated, sessionData);
    next();
  } catch (err) {
    next(err);
  }
};

export const handleSessionsWhichRequiredData = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  _res: express.Response,
  next: express.NextFunction // handleSessionIdAfterDataRetrieval
): void => {
  assert(req.retrievedSessionData, 'No session data retrieved.');
  const sessionData: ApplicationDataType = req.retrievedSessionData as ApplicationDataType;
  try {
    requireSessionDataForExistingId(sessionData);
    next();
  } catch (err) {
    next(err);
  }
};

export const handleCopySessionStoreDataToSession = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  _res: express.Response,
  next: express.NextFunction
): void => {
  assert(req.retrievedSessionData, 'No session data retrieved.');

  const sessionData: ApplicationDataType = req.retrievedSessionData as ApplicationDataType;
  saveSessionDataToSession(sessionData, req.session);
  next();
};
