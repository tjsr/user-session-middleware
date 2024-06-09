import { createUserIdFromEmail, getUserIdFromRequest, getUserIdFromSession } from './auth/user.js';

import { HttpStatusCode } from './httpStatusCodes.js';
import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { createUserIdFromEmail } from './auth/user.js';
import { endWithJsonMessage } from './utils/apiMiddlewareUtils.js';
import { getIp } from './utils/getIp.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';
import { userSessionEndpoints } from './api/endpoints.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createRandomId,
  createRandomUserId,
  createUserIdFromEmail,
  endWithJsonMessage,
  getIp,
  getUserIdFromRequest,
  getUserIdFromSession,
  createUserIdFromEmail,
  HttpStatusCode,
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
  UserId,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType,
  SessionStoreDataType,
  UserModel,
  UserSessionOptions
} from './types.js';
export type { 
  UserModel
} from './types/model.js';
export type {
  SessionMiddlewareErrorHandler,
  SessionMiddlewareHandler
} from './types.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
export { SessionMiddlewareError } from './errors/SessionMiddlewareError.js';
