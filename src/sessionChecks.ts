import * as express from 'express';

import { SessionId, SystemHttpRequestType, SystemSessionDataType } from './types.js';

import { SessionData } from "express-session";
import { applyNewIdToSession } from './getSession.js';

export const getStatusOnError = (err: Error|undefined): number|undefined => {
  if (err) {
    console.warn('Error getting session data', err);
    return 500;
  }
  return undefined;
};

export const endResponseOnError = (err: Error|undefined, res: express.Response): boolean => {
  if (err) {
    console.trace('Error getting session data', err);
    res.status(500);
    res.send(err);
    res.end();
    return true;
  }
  return false;
};

export const getStatusWhenNoSessionId = (
  sessionID: string|undefined
): number|undefined => {
  if (!sessionID) {
    // This should never get called.
    console.trace('No session ID received - can\'t process retrieved session.');
    return 500;
  }
  return undefined;
};

export const endResponseWhenNoSessionId = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response
): boolean => {
  const status = getStatusWhenNoSessionId(req.sessionID);
  if (status !== undefined) {
    res.status(status);
    res.end();
    return true;
  }
  return false;
};

export const getStatusWhenNewIdGeneratedButSessionDataAlreadyExists = (
  newSessionIdGenerated: boolean | undefined,
  retrievedSessionData: SessionData | null | undefined
): number|undefined => {
  if (newSessionIdGenerated === true && retrievedSessionData) {
    console.warn(getStatusWhenNewIdGeneratedButSessionDataAlreadyExists,
      'New session ID generated but session data already exists - this should never happen.');
    return 401;
  }
  return undefined;
};

export const endResponseWhenNewIdGeneratedButSessionDataAlreadyExists = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  retrievedSessionData: SessionData | null | undefined
): boolean => {
  const status = getStatusWhenNewIdGeneratedButSessionDataAlreadyExists(
    req.newSessionIdGenerated, retrievedSessionData);
  if (status !== undefined) {
    res.status(status);
    res.end();
    return true;
  }
  return false;
};

export const getStatusIfNoSessionData = (
  retrievedSessionData: SessionData | null | undefined
): number|undefined => {
  if (!retrievedSessionData) {
    console.warn('SessionID received but no session data, with no new id generated.');
    return 401;
  }
  return undefined;
};

export const regenerateSessionIdIfNoSessionData = (
  retrievedSessionData: SessionData | null | undefined,
  req: SystemHttpRequestType<SystemSessionDataType>
): SessionId | undefined => {
  if (!retrievedSessionData) {
    console.debug(regenerateSessionIdIfNoSessionData,
      `SessionID received for ${req.sessionID} but no session data, generating a new sessionId.`);
    const newSessionId = applyNewIdToSession(req, true);
    return newSessionId;
  }
  return undefined;
};

export const errorToNextIfNoSessionData = (
  retrievedSessionData: SessionData | null | undefined,
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  next: express.NextFunction
): boolean => {
  if (!retrievedSessionData) {
    const err = new Error(`SessionID received for ${req.sessionID} but no session data, ` +
    `with no new id generated. We should expect regenerateSessionIdIfNoSessionData to be ` +
    `called.  Calling to next(err).`);
    console.debug(errorToNextIfNoSessionData, err);
    res.status(401);
    next(err);
    return true;
  }
  return false;
};
