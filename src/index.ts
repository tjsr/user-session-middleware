import { createUserIdFromEmail } from './auth/user.js';
import { mysqlSessionStore } from './sessionStore.js';
import { userSessionEndpoints } from './api/endpoints.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createUserIdFromEmail,
  mysqlSessionStore,
  userSessionMiddleware,
  userSessionEndpoints
};

export type { 
  SystemHttpRequestType,
  SystemSessionDataType,
  UserSessionOptions,
  SystemHttpResponseType,
  SessionStoreDataType,
  UserModel
} from './types.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
