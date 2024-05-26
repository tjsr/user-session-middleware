import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";
import {
  endResponseOnError,
  errorToNextIfNoSessionData,
  getStatusWhenNewIdGeneratedButSessionDataAlreadyExists,
  getStatusWhenNoSessionId,
  regenerateSessionIdIfNoSessionData
} from "./sessionChecks.js";
import express, { NextFunction } from "express";
import session, { SessionData } from "express-session";

import { handleSessionFromStore } from "./simpleSessionId.js";

export const requiresSessionId = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  next: NextFunction
) => {
  if (req.sessionID === undefined) {
    // If sessionID doesn't exist, we haven't called express-session middleware.
    res.status(401);
    res.end();
  } else {
    next();
  }
};

export const handleSessionWithNewlyGeneratedId = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  _res: express.Response,
  next: express.NextFunction
) => {
  if (req.newSessionIdGenerated === true) {
    req.session.save();
  }
  next();
};

export const retrieveSessionDataFromStore = <ApplicationDataType extends SystemSessionDataType>(
  sessionStore: session.Store,
  sessionID: string
): Promise<ApplicationDataType | null | undefined> => {
  if (sessionID === undefined) {
    return Promise.reject(new Error('No session ID received'));
  }
  return new Promise<ApplicationDataType>((resolve, reject) => {
    sessionStore.get(
      sessionID,
      async (err: Error, genericSessionData: SessionData | null | undefined) => {
        if (err) {
          reject(err);
        }
        resolve(genericSessionData as ApplicationDataType);
      });
  });
};

export const retrieveSessionData = async <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.sessionID === undefined && req.newSessionIdGenerated === true) {
    const err = new Error('How can we save a sesison with no sessionID?');
    throw err;
  }
  if (!req.newSessionIdGenerated) {
    let genericSessionData: ApplicationDataType|null|undefined;
    try {
      genericSessionData = await retrieveSessionDataFromStore<ApplicationDataType>(req.sessionStore, req.sessionID!);
    } catch (err: unknown) {
      endResponseOnError(err as Error, res);
    }

    const newSessionId = regenerateSessionIdIfNoSessionData(genericSessionData, req);
    if (newSessionId) {
      console.debug(`New sessionId ${newSessionId} assigned.`);
    }

    if (errorToNextIfNoSessionData(genericSessionData, req, res, next)) {
      return;
    }

    const responseCode: number|undefined = getStatusWhenNoSessionId(req.sessionID) ||
      getStatusWhenNewIdGeneratedButSessionDataAlreadyExists(req.newSessionIdGenerated, genericSessionData);

    if (undefined !== responseCode) {
      res.status(responseCode!);
      res.end();
      return;
    }

    handleSessionFromStore(req, res, genericSessionData, next);
  } else {
    next();
  }
};
