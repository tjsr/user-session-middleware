import { createUserIdFromEmail, getUserIdFromRequest, getUserIdFromSession } from './auth/user.ts';
import { endWithJsonMessage, validateHasUserId } from './utils/apiMiddlewareUtils.ts';

import { HttpStatusCode } from './httpStatusCodes.ts';
import { createRandomId } from './utils/createRandomId.ts';
import { createRandomUserId } from './sessionUser.ts';

export { getMysqlSessionStore } from './sessionStore.ts';

// prettier-ignore
export {
  createRandomId,
  createRandomUserId,
  createUserIdFromEmail,
  endWithJsonMessage,
  getUserIdFromRequest,
  getUserIdFromSession,
  HttpStatusCode,
  validateHasUserId
};

export { useUserSessionMiddleware } from './useUserSessionMiddleware.ts';

export type { uuid, uuid4, uuid5, EmailAddress, IPAddress, UserId, IdNamespace } from './types.ts';

export type { SystemResponseLocals } from './types/locals.ts';
export type { UserSessionData, SessionStoreDataType, UserSessionDataFields } from './types/session.ts';

export type { SystemHttpRequestType } from './types/request.ts';
export type { SystemHttpResponseType } from './types/response.ts';

export type { UserSessionOptions } from './types/sessionOptions.ts';

export type { UserModel } from './types/model.ts';
export type {
  UserSessionMiddlewareErrorHandler,
  // eslint-disable-next-line @stylistic/js/comma-dangle
  UserSessionMiddlewareRequestHandler,
} from './types/middlewareHandlerTypes.ts';
export type { SystemRequestOrExpressRequest, SystemResponseOrExpressResponse } from './types/optionalReqRes.ts';
export { SessionHandlerError } from './errors/SessionHandlerError.ts';
export { SessionMiddlewareError } from './errors/SessionMiddlewareError.ts';

export * as express from './express/index.ts';
export * as session from './express-session/index.ts';
