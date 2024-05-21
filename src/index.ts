import {
  handleSessionWithNewlyGeneratedId,
  requiresSessionId,
  retrieveSessionData
} from './sessionMiddlewareHandlers.js';

import { mysqlSessionStore } from './sessionStore.js';
import { sessionHandlerMiddleware } from './getSession.js';
import { setUserCookies } from './setUserCookies.js';
import { useSessionId } from './useSessionId.js';

export {
  mysqlSessionStore,
  setUserCookies,
  sessionHandlerMiddleware,
  useSessionId,
  requiresSessionId,
  handleSessionWithNewlyGeneratedId,
  retrieveSessionData
};

export type { SystemHttpRequestType, SystemSessionDataType } from './types.js';
