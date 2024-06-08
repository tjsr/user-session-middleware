import { getUserIdFromRequest, getUserIdFromSession } from './auth/user.js';

import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { createUserIdFromEmail } from './auth/user.js';
import { getIp } from './utils/getIp.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';
import { userSessionEndpoints } from './api/endpoints.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createRandomId,
  createRandomUserId,
  getIp,
  getUserIdFromRequest,
  getUserIdFromSession,
  createUserIdFromEmail,
  mysqlSessionStore,
  setUserIdNamespace,
  userSessionMiddleware,
  userSessionEndpoints
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
  UserModel,
  UserSessionOptions
} from './types.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
