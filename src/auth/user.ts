import {
  EmailAddress,
  SystemHttpRequestType,
  SystemSessionDataType,
  UserId
} from '../types.js';
import { createRandomUserId, saveSessionPromise } from '../sessionUser.js';

import { Session } from 'express-session';
import { getUserIdNamespace } from './userNamespace.js';
import { v5 as uuidv5 } from 'uuid';

export type AuthenticationRestResult = {
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  message?: string;
  sessionId?: string;
};

export const createUserIdFromEmail = (email: EmailAddress): UserId => {
  return uuidv5(email, getUserIdNamespace());
};

export const getUserIdFromRequest = async <SessionData extends SystemSessionDataType>(
  request: SystemHttpRequestType<SessionData>
): Promise<UserId|undefined> => {
  return getUserIdFromSession(request.session);
};

export const getUserIdFromSession = async <SessionData extends SystemSessionDataType>(
  session: Session & SessionData
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

const createRandomIdAndSave = (session: Session & SystemSessionDataType): Promise<UserId|undefined> => {
  session.userId = createRandomUserId();
  return new Promise<UserId|undefined>((resolve, reject) => {
    saveSessionPromise(session).then(() => {
      console.trace(createRandomIdAndSave, 'Returning user id', session.userId);
      return resolve(session?.userId);
    }).catch(reject);
  });
};
