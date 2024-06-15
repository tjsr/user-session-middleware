import { createUserIdFromEmail, getUserIdFromRequest, getUserIdFromSession } from './src/auth/user.js';
import { endWithJsonMessage, validateHasUserId } from './src/utils/apiMiddlewareUtils.js';

import { HttpStatusCode } from './src/httpStatusCodes.js';
import { createRandomId } from './src/utils/createRandomId.js';
import { createRandomUserId } from './src/sessionUser.js';
import { getIp } from './src/utils/getIp.js';
import { mysqlSessionStore } from './src/sessionStore.js';
import { setUserIdNamespace } from './src/auth/userNamespace.js';

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
  validateHasUserId
};

export { useUserSessionMiddleware } from './src/useUserSessionMiddleware.js';

export { userSessionEndpoints } from './src/api/endpoints.js';

export type {
  uuid,
  uuid4,
  uuid5,
  EmailAddress,
  HandlerName,
  IPAddress,
  UserId
} from './src/types.js';

export type { SystemResponseLocals } from './src/types/locals.js';
export type { UserSessionData,
  SessionStoreDataType,
  UserSessionDataFields } from './src/types/session.js';

export type { SystemHttpRequestType } from './src/types/request.js';
export type { SystemHttpResponseType } from './src/types/response.js';

export type {
  UserSessionOptions
} from './src/types/sessionOptions.js';

export type { 
  UserModel
} from './src/types/model.js';
export type {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from './src/types/middlewareHandlerTypes.js';
export type {   SystemRequestOrExpressRequest,
  SystemResponseOrExpressResponse
} from './src/types/optionalReqRes.js';
export { SessionHandlerError } from './src/errors/SessionHandlerError.js';
export { SessionMiddlewareError } from './src/errors/SessionMiddlewareError.js';

export * as express from './src/express/index.js';
export * as session from './src/express-session/index.js';
