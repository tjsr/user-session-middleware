import {
  SaveSessionError
} from './errors/errorClasses.js';
import { Session } from 'express-session';
import { SystemHttpRequestType } from './types/request.js';
import { UserSessionData } from './types/session.js';
import { getSnowflake } from './snowflake.js';
import { getUserIdNamespace } from './auth/userNamespace.js';
import { requireRequestSessionId } from './session/sessionChecks.js';
import { requireSessionIDValuesMatch } from './session/sessionChecks.js';
import { requireSessionId } from './session/sessionChecks.js';
import { requireSessionInitialized } from './session/sessionChecks.js';
import { requireSessionIsIsString } from './session/sessionChecks.js';
import { uuid5 } from './types.js';
import { v5 as uuidv5 } from 'uuid';

export const createRandomUserId = (): uuid5 => {
  return uuidv5(getSnowflake().toString(), getUserIdNamespace());
};

export const saveSessionPromise = async (session: Session): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.debug(saveSessionPromise, `Saving session ${session.id} data to store.`);

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
  session: Session & Partial<ApplicationDataType>
): Promise<void> => {
  requireSessionInitialized(session);
  requireSessionId(session);
  if (!session.userId) {
    const userId: uuid5 = createRandomUserId();
    console.log(assignUserIdToSession,
      `Assigned a new userId ${userId} to session ${session.id}`
    );
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

    return assignUserIdToSession(request.session);
  } catch (err) {
    return Promise.reject(err);
  }
};
