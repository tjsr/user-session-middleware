import { EmailAddress, SystemHttpRequestType, UserId, uuid5 } from '../types.js';

import { createRandomId } from '../utils/createRandomId.js';
import { getUserIdNamespace } from './userNamespace.js';
import { saveSessionPromise } from '../sessionUser.js';
import { v5 as uuidv5 } from 'uuid';

export const createUserIdFromEmail = (email: EmailAddress): uuid5 => {
  return uuidv5(email, getUserIdNamespace());
};

export const createRandomUserId = (): UserId => {
  return createRandomId(getUserIdNamespace());
};

export const getUserId = async (request: SystemHttpRequestType): Promise<UserId|undefined> => {
  if (request.session && request.session.userId) {
    // console.log('Got a session for current call');
    return Promise.resolve(request.session.userId);
  } else if (!request.session) {
    // TODO return a UserSessionError
    return Promise.reject(new Error('No session'));
  } else {
    request.session.userId = createRandomUserId();
    return new Promise<UserId|undefined>((resolve, reject) => {
      saveSessionPromise(request.session).then(() => {
        console.trace(getUserId, 'Returning user id', request.session.userId);
        return resolve(request.session?.userId);
      }).catch((err: Error) => {
        return reject(err);
      });
    });
  }
};
