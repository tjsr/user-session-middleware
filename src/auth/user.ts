import { EmailAddress, UserId, uuid5 } from '../../../tagtool/src/types.js';
import { IdNamespace, SystemHttpRequestType, SystemSessionDataType } from '../types.js';

import { UUIDNamespaceNotDefinedError } from '../errors/errorClasses.js';
import { createRandomId } from '../utils/createRandomId.js';
// import { TagtoolRequest } from '../../../tagtool/src/session.js';
// import { createRandomId } from '../../../tagtool/src/utils/createRandomId.js';
import { v5 as uuidv5 } from 'uuid';

export type AuthenticationRestResult = {
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  message?: string;
  sessionId?: string;
};

let USERID_UUID_NAMESPACE: IdNamespace|undefined = process.env['USERID_UUID_NAMESPACE'];
// || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const setUserIdNamespace = (namespace: IdNamespace): void => {
  USERID_UUID_NAMESPACE = namespace;
};

export const getUserIdNamespace = (): IdNamespace => {
  if (process.env['USERID_UUID_NAMESPACE']) {
    return process.env['USERID_UUID_NAMESPACE'];
  }
  if (USERID_UUID_NAMESPACE === undefined) {
    throw new UUIDNamespaceNotDefinedError();
  }
  return USERID_UUID_NAMESPACE;
};

export const createUserIdFromEmail = (email: EmailAddress): uuid5 => {
  return uuidv5(email, getUserIdNamespace());
};

export const createRandomUserId = (): uuid5 => {
  return createRandomId(getUserIdNamespace());
};

export const getUserId = <RequestType extends SystemHttpRequestType<SessionData>,
  SessionData extends SystemSessionDataType>(request: RequestType): UserId => {
  if (request.session && request.session.userId) {
    // console.log('Got a session for current call');
    return request.session.userId;
  } else if (!request.session) {
    throw new Error('No session');
  } else {
    request.session.userId = createRandomUserId();
    request.session.save();
    console.trace(getUserId, 'Returning user id', request.session.userId);
    return request.session.userId;
  }
};
