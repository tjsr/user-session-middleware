import * as express from 'express';

import { SystemHttpRequestType, SystemSessionDataType, uuid5 } from './types.js';
import { v5 as uuidv5, validate } from 'uuid';

import { getSnowflake } from './snowflake.js';

const LIBRARY_DEFAULT_USERID_UUID_NAMESPACE = 'd850e0d9-a02c-4a25-9ade-9711b942b8ba'

const getUuidNamespace = (systemDefault?: string): uuid5 => {
  const libUidNamespace: uuid5|undefined = process.env['LIBRARY_DEFAULT_USERID_UUID_NAMESPACE'];
  if (libUidNamespace) {
    if (!validate(libUidNamespace)) {
      throw new Error(
        `Invalid environment value for 'USERID_UUID_NAMESPACE' ${libUidNamespace}`
      );
    }
    return libUidNamespace;
  }

  if (undefined !== systemDefault) {
    if (!validate(systemDefault)) {
      throw new Error(`Invalid system UUID namespace ${systemDefault}`);
    }
    return systemDefault as uuid5;
  }

  return LIBRARY_DEFAULT_USERID_UUID_NAMESPACE;
};

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
    // if (!req.sessionID) {
    //   req.session.id = sessionId;
    // }
    // retrieve session from session store using sessionId
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
      next();
    });
  } else {
    // if (req.session.userId == undefined) {
    const userId: uuid5 = createRandomUserId();
    console.log(
      `Assigned a new userId ${userId} to session ${req.session.id}`
    );
    req.session.userId = userId;
    // }

    next();
  }
};
