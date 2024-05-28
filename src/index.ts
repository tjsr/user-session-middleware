import { assignUserIdToRequestSessionHandler } from './sessionUserHandler.js';
import { mysqlSessionStore } from './sessionStore.js';
import { sessionHandlerMiddleware } from './getSession.js';
import { setUserCookies } from './setUserCookies.js';
import { userSessionMiddleware } from './sessionMiddlewareHandlers.js';

export {
  assignUserIdToRequestSessionHandler,
  mysqlSessionStore,
  // setSessionCookie,
  setUserCookies,
  sessionHandlerMiddleware,
  // handleSessionIdRequired,
  // handleSessionWithNewlyGeneratedId,
  // handleSessionDataRetrieval,

  userSessionMiddleware
};

export type { SystemHttpRequestType, SystemSessionDataType } from './types.js';
export type { SessionHandlerError } from './errors.js';
