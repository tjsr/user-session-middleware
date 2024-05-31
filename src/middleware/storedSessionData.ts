import { ERROR_RETRIEVING_SESSION_DATA, ERROR_SAVING_SESSION } from '../errors.js';
import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from './handlerChainLog.js';
import {
  requireNoSessionDataForNewlyGeneratedId,
  requireSessionDataForExistingId,
} from '../sessionHandlerErrors.js';
import { retrieveSessionDataFromStore, saveSessionDataToSession } from '../store/loadData.js';

import { SessionHandlerError } from '../errors.js';
import assert from "assert";
import { checkNewlyGeneratedId } from './handleSessionId.js';
import express from "express";
import {
  regenerateSessionIdIfNoSessionData,
} from "../sessionChecks.js";

export const handleSessionDataRetrieval = async <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionCookie
): Promise<void> => {
  addCalledHandler(response, handleSessionDataRetrieval.name);
  
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

  response.locals.retrievedSessionData = genericSessionData as ApplicationDataType;
  next();
};

export const handleSessionWithNoSessionData = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionsWithRequiredData
): void => {
  assert(response.locals.retrievedSessionData, 'No session data retrieved.');
  const sessionData: ApplicationDataType = response.locals.retrievedSessionData as ApplicationDataType;
  
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
  _req: SystemHttpRequestType<ApplicationDataType>,
  response: SystemHttpResponse<SessionStoreDataType>,
  next: express.NextFunction // handleSessionIdAfterDataRetrieval
): void => {
  addCalledHandler(response, handleSessionsWhichRequiredData.name);
  verifyPrerequisiteHandler(response, handleCopySessionStoreDataToSession.name);
  assert(response.locals.retrievedSessionData, 'No session data retrieved.');
  const sessionData: SessionStoreDataType = response.locals.retrievedSessionData as SessionStoreDataType;
  try {
    requireSessionDataForExistingId(sessionData);
    next();
  } catch (err) {
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
    // assert(response.locals.retrievedSessionData,
    //   'No session data retrieved, handleSessionDataRetrieval must be called first.');
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
