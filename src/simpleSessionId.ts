import * as express from 'express';

import { SystemHttpRequestType, SystemSessionDataType } from './types.js';

import { SessionData } from "express-session";

export const simpleSessionId = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  res: express.Response,
  next: () => void
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
        if (err) {
          console.warn('Error getting session data', err);
          res.status(500);
          res.send(err);
          res.end();
          return;
        }

        if (req.sessionID && req.newSessionIdGenerated === true) {
          if (genericSessionData !== undefined && genericSessionData !== null) {
            console.warn(`SessionID received for ${req.sessionID} but new id generated. Ending session call.`);
            res.status(401);
            res.end();
            return;
          }

          req.session.save();
          next();
          return;
        }

        const sessionData: ApplicationDataType | undefined =
          genericSessionData as ApplicationDataType;

        // if (
        //   req.sessionID &&
        //   sessionData === undefined &&
        //   !req.newSessionIdGenerated
        // ) {
        //   // req.session.newId = undefined;
        //   console.debug(`SessionID received for ${req.sessionID} but no session data,
        // with no new id generated. Ending session call.`);
        //   // res.status(401);
        //   // res.end();
        //   // return;
        // }
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
  }
};
