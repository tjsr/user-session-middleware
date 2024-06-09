import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createRandomId,
  createRandomUserId,
  mysqlSessionStore,
  setUserIdNamespace,
  userSessionMiddleware
};

export type { SystemHttpRequestType, SystemSessionDataType, UserSessionOptions } from './types.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
