import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { getUserId } from './auth/user.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createRandomId,
  createRandomUserId,
  getUserId,
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
  UserSessionOptions
} from './types.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
