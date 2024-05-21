import * as express from 'express';

import { Session, SessionData } from "express-session";
import { SystemHttpRequestType, SystemSessionDataType } from './types.js';
import {
  endResponseIfNoSessionData,
  endResponseOnError,
  getStatusWhenNewIdGeneratedButSessionDataAlreadyExists,
  getStatusWhenNoSessionId
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
//   session: Session & Partial<ApplicationDataType>,
):void => {

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

  if (endResponseIfNoSessionData(retrievedSessionData, req, res)) {
    return;
  }

  const sessionData: ApplicationDataType | undefined = retrievedSessionData as ApplicationDataType;
  saveSessionDataToSession(sessionData, req.session);
  next();
};

export const simpleSessionId = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  res: express.Response,
  next: express.NextFunction,
  storeSessionHandler = handleSessionFromStore
) => {
  if (req.sessionID === undefined && req.newSessionIdGenerated === true) {
    req.session.save();
    next();
  } else if (req.sessionID === undefined) {
    // If sessionID doesn't exist, we haven't called express-session middleware.
    res.status(401);
    res.end();
    return;
  } else {
    req.sessionStore.get(
      req.sessionID,
      (err: Error, genericSessionData: SessionData | null | undefined) => {
        if (endResponseOnError(err, res)) {
          return;
        }
        storeSessionHandler(req, res, genericSessionData, next);
      }
    );
  }
};
