import * as express from 'express';

import { SystemHttpRequestType, SystemSessionDataType } from './types.js';

import { SessionData } from "express-session";

export const getStatusOnError = (err: Error|undefined): number|undefined => {
  if (err) {
    console.warn('Error getting session data', err);
    return 500;
  }
  return undefined;
};

export const endResponseOnError = (err: Error|undefined, res: express.Response): boolean => {
  if (err) {
    console.warn('Error getting session data', err);
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
    console.warn('No session ID received - can\'t process retrieved session.');
    return 500;
  }
  return undefined;
};

export const endResponseWhenNoSessionId = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response
): boolean => {
  if (!req.sessionID) {
    // This should never get called.
    console.warn('No session ID received - can\'t process retrieved session.');
    res.status(500);
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
    console.warn('New session ID generated but session data already exists - this should never happen.');
    return 401;
  }
  return undefined;
};

export const endResponseWhenNewIdGeneratedButSessionDataAlreadyExists = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  retrievedSessionData: SessionData | null | undefined
): boolean => {
  if (req.newSessionIdGenerated === true && retrievedSessionData) {
    console.warn(`SessionID received for ${req.sessionID} but new id generated - this should never ` +
      `happen and session data shouldn't yet be in the session store. Ending session call.`);
    res.status(401);
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

export const endResponseIfNoSessionData = (
  retrievedSessionData: SessionData | null | undefined,
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response
): boolean => {
  if (!retrievedSessionData) {
    console.debug(`SessionID received for ${req.sessionID} but no session data, ` +
    `with no new id generated. Ending session call.`);
    res.status(401);
    res.end();
    return true;
  }
  return false;
};
