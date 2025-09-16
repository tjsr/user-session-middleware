import { EmailAddress, IdNamespace, UserId, uuid5 } from '../types.ts';
import { SessionNotGeneratedError, SessionUserInfoError } from '../errors/errorClasses.ts';
import { v5 as uuidv5, validate as validateUuid } from 'uuid';

import { DeprecatedFunctionError } from '../utils/testing/types.ts';
import { Session } from '../express-session/index.ts';
import { SystemHttpRequestType } from '../types/request.ts';
import { UserSessionData } from '../types/session.ts';
import assert from 'node:assert';
import { createRandomId } from '../utils/createRandomId.ts';
import { getAppUserIdNamespace } from './userNamespace.ts';
import { saveSessionPromise } from '../sessionUser.ts';

export const createUserIdFromEmail = (userIdNamespace: IdNamespace, email: EmailAddress): uuid5 => {
  assert(email !== undefined);
  assert(userIdNamespace !== undefined);

  if (email === undefined) {
    throw new Error('createUserIdFromEmail called with undefined email parameter.');
  }
  if (!validateUuid(userIdNamespace)) {
    throw new TypeError(
      `Invalid IdNamespace/UUID '${userIdNamespace?.toString()}' namespace provided to createUserIdFromEmail.`
    );
  }

  return uuidv5(email, userIdNamespace);
};

export const createRandomUserId = (userIdNamespace: IdNamespace): UserId => {
  if (!userIdNamespace) {
    throw new DeprecatedFunctionError(
      'createRandomUserId',
      undefined,
      'createRandomUserId must be called with a userIdNamespace parameter, or use createAppRandomUserId'
    );
  }
  if (!validateUuid(userIdNamespace)) {
    throw new TypeError(
      `Invalid IdNamespace/UUID ${userIdNamespace?.toString()} namespace provided to createRandomUserId.`
    );
  }

  return createRandomId(userIdNamespace);
};

export const getUserIdFromRequest = async <SD extends UserSessionData = UserSessionData>(
  request: SystemHttpRequestType<SD>,
  noCreate = false
): Promise<UserId | undefined> => {
  const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);
  return getUserIdFromSession(userIdNamespace, request.session, noCreate);
};

export const applyUserIdFromSession = (userIdNamespace: IdNamespace, session: Session): void => {
  if (session.userId) {
    return;
  }
  if (session.email) {
    session.userId = createUserIdFromEmail(userIdNamespace, session.email);
    return;
  }
  session.userId = createRandomUserId(userIdNamespace);
};

export const getUserIdFromSession = async <SD extends UserSessionData = UserSessionData>(
  userIdNamespace: IdNamespace,
  session: Session & SD,
  noCreate = false
): Promise<UserId> => {
  if (session && session.userId) {
    return Promise.resolve(session.userId);
  } else if (!session) {
    // TODO return a UserSessionError
    return Promise.reject(new SessionNotGeneratedError());
  } else if (!noCreate) {
    return createRandomIdAndSave(userIdNamespace, session);
  } else {
    return Promise.reject(new SessionUserInfoError('User session had no credentials.'));
  }
};

export const createRandomIdAndSave = (
  userIdNamespace: IdNamespace,
  session: Session & UserSessionData
): Promise<UserId> => {
  session.userId = createRandomUserId(userIdNamespace);
  return new Promise<UserId>((resolve, reject) => {
    saveSessionPromise(session)
      .then(() => {
        console.trace(createRandomIdAndSave, 'Returning user id', session.userId);
        return resolve(session.userId);
      })
      .catch(reject);
  });
};
