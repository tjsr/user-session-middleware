import * as express from 'express';

import { Session, SessionData } from "express-session";
import { SystemHttpRequestType, SystemSessionDataType } from './types.js';
import {
  errorToNextIfNoSessionData,
  getStatusWhenNewIdGeneratedButSessionDataAlreadyExists,
  getStatusWhenNoSessionId,
  regenerateSessionIdIfNoSessionData
} from './sessionChecks.js';

export const saveSessionDataToSession = <ApplicationDataType extends SystemSessionDataType>(
  storedSessionData: ApplicationDataType,
  session: Session & Partial<ApplicationDataType>
): void => {
  session.newId = undefined;
  if (storedSessionData?.userId && session.userId == undefined) {
    session.userId = storedSessionData.userId;
  }
  if (storedSessionData?.email && session.email == undefined) {
    session.email = storedSessionData.email;
  }
  if (storedSessionData?.newId !== undefined && session.newId == undefined) {
    // Should only ever be new the first time we write a userId received from another auth source.
    session.newId = false;
  }

  session.save();
};

export const handleSessionFromStore = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  res: express.Response,
  retrievedSessionData: SessionData | null | undefined,
  next: express.NextFunction
):void => {
  // TODO: Remove 38-51
  const responseCode: number|undefined = getStatusWhenNoSessionId(req.sessionID) ||
    getStatusWhenNewIdGeneratedButSessionDataAlreadyExists(req.newSessionIdGenerated, retrievedSessionData);

  if (undefined !== responseCode) {
    res.status(responseCode!);
    res.end();
    return;
  }

  if (req.newSessionIdGenerated === true) {
    req.session.save();
    next();
    return;
  }

  regenerateSessionIdIfNoSessionData(retrievedSessionData, req);

  if (errorToNextIfNoSessionData(retrievedSessionData, req, res, next)) {
    return;
  }

  const sessionData: ApplicationDataType | undefined = retrievedSessionData as ApplicationDataType;
  saveSessionDataToSession(sessionData, req.session);
  next();
};
