import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";
import { endResponseIfNoSessionData, endResponseOnError } from "./sessionChecks.js";

import { SessionData } from "express-session";
import express from "express";
import { handleSessionFromStore } from "./simpleSessionId.js";

export const requiresSessionId = (req: SystemHttpRequestType<SystemSessionDataType>, res: express.Response) => {
  if (req.sessionID === undefined) {
    // If sessionID doesn't exist, we haven't called express-session middleware.
    res.status(401);
    res.end();
  }
};

export const handleSessionWithNewlyGeneratedId = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  _res: express.Response,
  next: express.NextFunction
) => {
  if (req.newSessionIdGenerated === true) {
    req.session.save();
    next();
  }
};

export const retrieveSessionData = async <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.sessionID === undefined && req.newSessionIdGenerated === true) {
    throw new Error('How can we save a sesison with no sessionID?');
    req.session.save();
    next();
  }
  if (!req.newSessionIdGenerated) {
    req.sessionStore.get(
      req.sessionID,
      async (err: Error, genericSessionData: SessionData | null | undefined) => {
        if (endResponseOnError(err, res)) {
          return;
        }
        if (endResponseIfNoSessionData(genericSessionData, req, res)) {
          return;
        }
      
        handleSessionFromStore(req, res, genericSessionData, next);
      }
    );
  }
};
