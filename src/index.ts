import { createUserIdFromEmail, getUserIdFromRequest, getUserIdFromSession } from './auth/user.js';
import { endWithJsonMessage, validateHasUserId } from './utils/apiMiddlewareUtils.js';

import { HttpStatusCode } from './httpStatusCodes.js';
import { createRandomId } from './utils/createRandomId.js';
import { createRandomUserId } from './sessionUser.js';
import { mysqlSessionStore } from './sessionStore.js';
import { setUserIdNamespace } from './auth/userNamespace.js';

export {
  createRandomId,
  createRandomUserId,
  createUserIdFromEmail,
  endWithJsonMessage,
  getUserIdFromRequest,
  getUserIdFromSession,
  HttpStatusCode,
  mysqlSessionStore,
  setUserIdNamespace,
  validateHasUserId
};

export { useUserSessionMiddleware } from './useUserSessionMiddleware.js';

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
export type { UserSessionData,
  SessionStoreDataType,
  UserSessionDataFields } from './types/session.js';

export type { SystemHttpRequestType } from './types/request.js';
export type { SystemHttpResponseType } from './types/response.js';

export type {
  UserSessionOptions
} from './types/sessionOptions.js';

export type { 
  UserModel
} from './types/model.js';
export type {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from './types/middlewareHandlerTypes.js';
export type {   SystemRequestOrExpressRequest,
  SystemResponseOrExpressResponse
} from './types/optionalReqRes.js';
export { SessionHandlerError } from './errors/SessionHandlerError.js';
export { SessionMiddlewareError } from './errors/SessionMiddlewareError.js';

export * as express from './express/index.js';
export * as session from './express-session/index.js';
