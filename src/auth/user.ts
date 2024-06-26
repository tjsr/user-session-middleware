import {
  EmailAddress,
  UserId,
  uuid5
} from '../types.js';
import { SessionNotGeneratedError, SessionUserInfoError } from '../errors/errorClasses.js';

import { Session } from '../express-session/index.js';
import { SystemHttpRequestType } from '../types/request.js';
import { UserSessionData } from '../types/session.js';
import assert from 'node:assert';
import { createRandomId } from '../utils/createRandomId.js';
import { getUserIdNamespace } from './userNamespace.js';
import { saveSessionPromise } from '../sessionUser.js';
import { v5 as uuidv5 } from 'uuid';

export const createUserIdFromEmail = (email: EmailAddress): uuid5 => {
  assert(email !== undefined);
  return uuidv5(email, getUserIdNamespace());
};

export const createRandomUserId = (): UserId => {
  return createRandomId(getUserIdNamespace());
};

export const getUserIdFromRequest = async <SD extends UserSessionData = UserSessionData>(
  request: SystemHttpRequestType<SD>,
  noCreate = false
): Promise<UserId|undefined> => {
  return getUserIdFromSession(request.session, noCreate);
};

export const getUserIdFromSession = async <SD extends UserSessionData = UserSessionData>(
  session: Session & SD,
  noCreate = false
): Promise<UserId> => {
  if (session && session.userId) {
    return Promise.resolve(session.userId);
  } else if (!session) {
    // TODO return a UserSessionError
    return Promise.reject(new SessionNotGeneratedError());
  } else if (!noCreate) {
    return createRandomIdAndSave(session);
  } else {
    return Promise.reject(new SessionUserInfoError('User session had no credentials.'));
  }
};

export const createRandomIdAndSave = (session: Session & UserSessionData): Promise<UserId> => {
  session.userId = createRandomUserId();
  return new Promise<UserId>((resolve, reject) => {
    saveSessionPromise(session).then(() => {
      console.trace(createRandomIdAndSave, 'Returning user id', session.userId);
      return resolve(session.userId);
    }).catch(reject);
  });
};

