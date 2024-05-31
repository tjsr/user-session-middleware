import {
  RequestSessionIdRequiredError,
  SaveSessionError,
  SessionDataNotFoundError,
  SessionIdRequiredError,
  SessionIdTypeError
} from './errors.js';
import { SystemHttpRequestType, SystemSessionDataType, uuid5 } from './types.js';

import { Session } from 'express-session';
import { getSnowflake } from './snowflake.js';
import { getUuidNamespace } from './getGuidNamespace.js';
import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE = getUuidNamespace();

export const createRandomUserId = (): uuid5 => {
  return uuidv5(getSnowflake().toString(), USERID_UUID_NAMESPACE);
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

export const assignUserIdToSession = async <ApplicationDataType extends SystemSessionDataType>(
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
      throw new SaveSessionError('Error saving session data to store.', err);
    }
  }
};

const requireSessionIsIsString = (session: Session) => {
  if (typeof session.id !== 'string') {
    throw new SessionIdTypeError(
      `Session ID defined on session is not a uuid (${typeof session.id}) when assigning userId.`);
  }
};

const requireSessionId = (session: Session) => {
  if (!session.id) {
    throw new SessionIdRequiredError('Session ID is not defined on session when assigning userId to session.');
  }
};

const requireRequestSessionId = (sessionID: string|undefined) => {
  if (!sessionID) {
    throw new RequestSessionIdRequiredError('Request sessionID is not defined when assigning userId to session.');
  }
};

const requireSessionInitialized = (session: Session) => {
  if (!session) {
    throw new SessionDataNotFoundError('Session is not defined when assigning userId to session.');
  }
};

export const assignUserIdToRequestSession = async <ApplicationDataType extends SystemSessionDataType>(
  request: SystemHttpRequestType<ApplicationDataType>
) => {
  try {
    requireRequestSessionId(request.sessionID);
    requireSessionInitialized(request.session);
    requireSessionId(request.session);
    requireSessionIsIsString(request.session);

    return assignUserIdToSession(request.session);
  } catch (err) {
    return Promise.reject(err);
  }
};
