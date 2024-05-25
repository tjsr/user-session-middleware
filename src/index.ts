import { assignUserIdToRequestSessionHandler, setSessionCookie } from './sessionUserHandler.js';
import {
  handleSessionWithNewlyGeneratedId,
  requiresSessionId,
  retrieveSessionData
} from './sessionMiddlewareHandlers.js';

import { mysqlSessionStore } from './sessionStore.js';
import { sessionHandlerMiddleware } from './getSession.js';
import { setUserCookies } from './setUserCookies.js';

export {
  assignUserIdToRequestSessionHandler,
  mysqlSessionStore,
  setSessionCookie,
  setUserCookies,
  sessionHandlerMiddleware,
  requiresSessionId,
  handleSessionWithNewlyGeneratedId,
  retrieveSessionData
};

export type { SystemHttpRequestType, SystemSessionDataType } from './types.js';
