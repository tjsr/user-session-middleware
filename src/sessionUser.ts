import { IdNamespace, UserId, uuid5 } from './types.js';

import { NamespaceNotProvidedError } from './errors/middlewareErrorClasses.js';
import { SaveSessionError } from './errors/errorClasses.js';
import { Session } from 'express-session';
import { SystemHttpRequestType } from './types/request.js';
import { UserSessionData } from './types/session.js';
import express from './express/index.js';
import { getAppUserIdNamespace } from './auth/userNamespace.js';
import { getSnowflake } from './snowflake.js';
import { requireRequestSessionId } from './session/sessionChecks.js';
import { requireSessionIDValuesMatch } from './session/sessionChecks.js';
import { requireSessionId } from './session/sessionChecks.js';
import { requireSessionInitialized } from './session/sessionChecks.js';
import { requireSessionIsIsString } from './session/sessionChecks.js';
import { v5 as uuidv5 } from 'uuid';

export const createRandomUserId = (namespace?: IdNamespace | undefined): UserId => {
  if (!namespace) {
    throw new NamespaceNotProvidedError();
  }
  return uuidv5(getSnowflake().toString(), namespace);
};

export const createAppRandomUserId = (app: express.Application): UserId => {
  return uuidv5(getSnowflake().toString(), getAppUserIdNamespace(app));
};

export const saveSessionPromise = async (session: Session): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.trace(saveSessionPromise, `Saving session ${session.id} data to store.`);

    session.save((err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};

export const regenerateSessionPromise = async (session: Session): Promise<void> => {
  const currentSession = session;
  currentSession.hasLoggedOut = true;
  session.userId = undefined!;
  session.email = undefined!;

  return new Promise((resolve, reject) => {
    console.debug(regenerateSessionPromise, `Regenerating session ${session.id}.`);

    session.regenerate((err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

export const assignUserIdToSession = async <ApplicationDataType extends UserSessionData>(
  userIdNamespace: IdNamespace,
  session: Session & Partial<ApplicationDataType>
): Promise<void> => {
  requireSessionInitialized(session);
  requireSessionId(session);
  if (!session.userId) {
    const userId: uuid5 = createRandomUserId(userIdNamespace);
    console.log(assignUserIdToSession, `Assigned a new userId ${userId} to session ${session.id}`);
    session.userId = userId;
    try {
      return saveSessionPromise(session);
    } catch (err) {
      throw new SaveSessionError(`Error saving session ${session.id} data to store.`, err);
    }
  }
};

export const assignUserIdToRequestSession = async <ApplicationDataType extends UserSessionData>(
  request: SystemHttpRequestType<ApplicationDataType>
): Promise<void> => {
  try {
    requireRequestSessionId(request.sessionID);
    requireSessionInitialized(request.session);
    requireSessionId(request.session);
    requireSessionIsIsString(request.session);
    requireSessionIDValuesMatch(request.sessionID, request.session.id);
    const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);

    return assignUserIdToSession(userIdNamespace, request.session);
  } catch (err) {
    return Promise.reject(err);
  }
};
