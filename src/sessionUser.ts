import { IdNamespace, UserId, uuid5 } from './types.ts';

import { NamespaceNotProvidedError } from './errors/middlewareErrorClasses.ts';
import { SaveSessionError } from './errors/errorClasses.ts';
import { Session } from 'express-session';
import { SystemHttpRequestType } from './types/request.ts';
import { UserSessionData } from './types/session.ts';
import { createUserIdFromEmail } from './auth/user.ts';
import express from './express/index.ts';
import { getAppUserIdNamespace } from './auth/userNamespace.ts';
import { getSnowflake } from './snowflake.ts';
import { requireRequestSessionId } from './session/sessionChecks.ts';
import { requireSessionIDValuesMatch } from './session/sessionChecks.ts';
import { requireSessionId } from './session/sessionChecks.ts';
import { requireSessionInitialized } from './session/sessionChecks.ts';
import { requireSessionIsIsString } from './session/sessionChecks.ts';
import { v5 as uuidv5 } from 'uuid';

const SAVE_AFTER_ASSIGN_USER_ID = true;

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
  session: Session & Partial<ApplicationDataType>,
  saveImmediate: boolean = SAVE_AFTER_ASSIGN_USER_ID
): Promise<void> => {
  requireSessionInitialized(session);
  requireSessionId(session);
  if (!session.userId) {
    const newOrGenerated = session.email ? 'generated' : 'random';
    const userId: uuid5 = session.email
      ? createUserIdFromEmail(userIdNamespace, session.email)
      : createRandomUserId(userIdNamespace);
    console.log(
      assignUserIdToSession,
      `Assigned a ${newOrGenerated} userId ${userId} to ` + `${newOrGenerated} session ${session.id}`
    );
    session.userId = userId;
    if (saveImmediate) {
      try {
        return saveSessionPromise(session);
      } catch (err) {
        throw new SaveSessionError(`Error saving session ${session.id} data to store.`, err);
      }
    }
  }
  return Promise.resolve();
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
    const saveImmediate = SAVE_AFTER_ASSIGN_USER_ID;
    const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);

    return assignUserIdToSession(userIdNamespace, request.session, saveImmediate);
  } catch (err) {
    return Promise.reject(err);
  }
};
