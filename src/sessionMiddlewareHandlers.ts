import { ErrorRequestHandler, RequestHandler } from "express";
import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler,
} from './types/middlewareHandlerTypes.js';
import {
  handleCopySessionStoreDataToSession,
  handleSessionDataRetrieval,
} from "./middleware/storedSessionData.js";
import {
  handleExistingSessionWithNoSessionData,
  handleNewSessionWithNoSessionData
} from './middleware/handleSessionWithNoData.js';
import { handleSessionCookie, handleSessionCookieOnError } from "./middleware/handleSessionCookie.js";
import {
  handleSessionIdAfterDataRetrieval,
  handleSessionIdRequired,
  handleSessionWithNewlyGeneratedId
} from "./middleware/handleSessionId.js";

import {
  UserSessionOptions
} from "./types.js";
import { expressSessionHandlerMiddleware } from "./getSession.js";
import { handleAssignUserIdToRequestSessionWhenNoExistingSessionData } from "./sessionUserHandler.js";
import { sessionErrorHandler } from './middleware/sessionErrorHandler.js';

export const userSessionMiddleware = (sessionOptions?: Partial<UserSessionOptions> | undefined): (
  // ((_req: SystemHttpRequestType,
  //   _response: SystemHttpResponseType | express.Response,
  //   _handleSessionWithNewlyGeneratedId: express.NextFunction) => void) |
  // ((_err: Error,
  //   _req: SystemHttpRequestType,
  //   _response: SystemHttpResponseType | express.Response,
  //   _handleSessionWithNewlyGeneratedId: express.NextFunction) => void) |
    UserSessionMiddlewareRequestHandler | UserSessionMiddlewareErrorHandler |
    RequestHandler | ErrorRequestHandler
)[] => {
  const expressSessionOptions: Partial<UserSessionOptions> = { ...sessionOptions };

  return [
    expressSessionHandlerMiddleware(expressSessionOptions),
    handleSessionIdRequired,
    handleSessionWithNewlyGeneratedId,
    handleSessionDataRetrieval,
    handleNewSessionWithNoSessionData,
    handleExistingSessionWithNoSessionData,
    handleSessionCookie,
    handleSessionCookieOnError,
    handleCopySessionStoreDataToSession,
    handleSessionIdAfterDataRetrieval,
    handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
    sessionErrorHandler,
  ];
};
