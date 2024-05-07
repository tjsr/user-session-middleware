import * as express from 'express';

import { SystemHttpRequestType, SystemSessionDataType } from './types.js';

import { SessionData } from "express-session";

export const simpleSessionId = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  res: express.Response,
  next: () => void
) => {
  req.sessionStore.get(
    req.sessionID,
    (err: Error, genericSessionData: SessionData | null | undefined) => {
      if (err) {
        console.warn('Error getting session data', err);
        res.status(500);
        res.send(err);
        res.end();
        return;
      }

      const sessionData: ApplicationDataType | undefined =
        genericSessionData as ApplicationDataType;

      if (
        req.sessionID &&
        sessionData === undefined &&
        !req.newSessionIdGenerated
      ) {
        req.session.newId = undefined;
        res.status(401);
        res.end();
        return;
      }
      req.session.newId = undefined;
      if (sessionData?.userId && req.session.userId == undefined) {
        req.session.userId = sessionData.userId;
      }
      if (sessionData?.email && req.session.email == undefined) {
        req.session.email = sessionData.email;
      }
      if (sessionData?.newId && req.session.newId == undefined) {
        // Should only ever be new the first time we write a userId received from another auth source.
        req.session.newId = false;
      }

      req.session.save();
      next();
    }
  );
};
