import {
  EmailAddress,
  UserId,
  uuid5
} from '../types.js';

import { Session } from '../types/express.js';
import { SystemHttpRequestType } from '../types/request.js';
import { UserSessionData } from '../types/session.js';
import { createRandomId } from '../utils/createRandomId.js';
import { getUserIdNamespace } from './userNamespace.js';
import { saveSessionPromise } from '../sessionUser.js';
import { v5 as uuidv5 } from 'uuid';

export type AuthenticationRestResult = {
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  message?: string;
  sessionId?: string;
};

export const createUserIdFromEmail = (email: EmailAddress): uuid5 => {
  return uuidv5(email, getUserIdNamespace());
};

export const createRandomUserId = (): UserId => {
  return createRandomId(getUserIdNamespace());
};

export const getUserIdFromRequest = async <SD extends UserSessionData = UserSessionData>(
  request: SystemHttpRequestType<SD>
): Promise<UserId|undefined> => {
  return getUserIdFromSession(request.session);
};

export const getUserIdFromSession = async <SD extends UserSessionData = UserSessionData>(
  session: Session & SD
): Promise<UserId|undefined> => {
  if (session && session.userId) {
    // console.log('Got a session for current call');
    return Promise.resolve(session.userId);
  } else if (!session) {
    // TODO return a UserSessionError
    return Promise.reject(new Error('No session'));
  } else {
    return createRandomIdAndSave(session);
  }
};

const createRandomIdAndSave = (session: Session & UserSessionData): Promise<UserId|undefined> => {
  session.userId = createRandomUserId();
  return new Promise<UserId|undefined>((resolve, reject) => {
    saveSessionPromise(session).then(() => {
      console.trace(createRandomIdAndSave, 'Returning user id', session.userId);
      return resolve(session?.userId);
    }).catch(reject);
  });
};
