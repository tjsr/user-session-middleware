import * as express from 'express';

import { SystemHttpRequestType, SystemSessionDataType, uuid5 } from './types.js';

import { getSnowflake } from './snowflake.js';
import { getUuidNamespace } from './getGuidNamespace.js';
import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE = getUuidNamespace();

export const createRandomUserId = (): uuid5 => {
  return uuidv5(getSnowflake().toString(), USERID_UUID_NAMESPACE);
};

export const useSessionId = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  _res: express.Response,
  next: () => void
) => {
  const sessionId = req.header('x-session-id') || req.session.id;
  if (sessionId && sessionId !== 'undefined') {
    // retrieve session from session store using sessionId
    if (!req.sessionStore) {
      const errMsg = 'sessionStore has not been configured and is undefined';
      console.error(errMsg);
      throw Error(errMsg);
    }
    req.sessionStore.get(sessionId, (err, sessionData) => {
      if (!err) {
        req.session.save();
      }
      if (sessionData) {
        req.session = Object.assign(req.session, sessionData);
        if (req.session.userId == undefined) {
          const userId: uuid5 = createRandomUserId();
          console.log(
            `Assigned a new userId ${userId} to session ${sessionId}`
          );
          req.session.userId = userId;
        }
      }
      req.session.save();
      next();
    });
  } else {
    const userId: uuid5 = createRandomUserId();
    console.log(
      `Assigned a new userId ${userId} to session ${req.session.id}`
    );
    req.session.userId = userId;
    req.session.save();
    next();
  }
};
