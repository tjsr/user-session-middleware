import { createUserIdFromEmail, getUserIdFromRequest, getUserIdFromSession } from './auth/user.js';
import { endWithJsonMessage, validateHasUserId } from './utils/apiMiddlewareUtils.js';

import { HttpStatusCode } from './httpStatusCodes.js';
import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { getIp } from './utils/getIp.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  createRandomId,
  createRandomUserId,
  createUserIdFromEmail,
  endWithJsonMessage,
  getIp,
  getUserIdFromRequest,
  getUserIdFromSession,
  HttpStatusCode,
  mysqlSessionStore,
  setUserIdNamespace,
  userSessionMiddleware,
  validateHasUserId
};

export type {
  uuid,
  uuid4,
  uuid5,
  EmailAddress,
  HandlerName,
  IPAddress,
  UserId
} from './types.js';

export type { SystemResponseLocals } from './types/locals.js';
export type { SystemSessionDataType, SessionStoreDataType, SessionDataFields } from './types/session.js';

export type { SystemHttpRequestType } from './types/request.js';
export type { SystemHttpResponseType } from './types/response.js';

export type {
  UserSessionOptions
} from './types/sessionOptions.js';

// import {   SystemResponseLocals,
//   SystemSessionDataType,
//   SessionStoreDataType,
//   UserSessionOptions
//  } from './types.js';
export type { 
  UserModel
} from './types/model.js';
export type {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler,
  SystemRequestOrExpressRequest,
  SystemResponseOrExpressResponse
} from './types/middlewareHandlerTypes.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
export { SessionMiddlewareError } from './errors/SessionMiddlewareError.js';
