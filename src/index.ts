import { getUserIdFromRequest, getUserIdFromSession } from './auth/user.js';

import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { getIp } from './utils/getIp.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createRandomId,
  createRandomUserId,
  getIp,
  getUserIdFromRequest,
  getUserIdFromSession,
  mysqlSessionStore,
  setUserIdNamespace,
  userSessionMiddleware
};

export type {
  uuid,
  uuid4,
  uuid5,
  EmailAddress,
  IPAddress,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType,
  SessionStoreDataType,
  UserSessionOptions
} from './types.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
