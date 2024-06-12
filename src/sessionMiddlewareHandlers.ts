import express, { ErrorRequestHandler, RequestHandler } from "express";
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
} from "./types/sessionOptions.js";
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
    // UserSessionMiddlewareRequestHandler | UserSessionMiddlewareErrorHandler |
    RequestHandler | ErrorRequestHandler
)[] => {
  const expressSessionOptions: Partial<UserSessionOptions> = { ...sessionOptions };

  return [
    expressSessionHandlerMiddleware(expressSessionOptions),
    handleSessionIdRequired as express.RequestHandler,
    handleSessionWithNewlyGeneratedId as express.RequestHandler,
    handleSessionDataRetrieval as express.RequestHandler,
    handleNewSessionWithNoSessionData as express.RequestHandler,
    handleExistingSessionWithNoSessionData as express.RequestHandler,
    handleSessionCookie as express.RequestHandler,
    // TODO: Fix correct type.
    handleSessionCookieOnError as ErrorRequestHandler,
    handleCopySessionStoreDataToSession as express.RequestHandler,
    handleSessionIdAfterDataRetrieval as express.RequestHandler,
    handleAssignUserIdToRequestSessionWhenNoExistingSessionData as express.RequestHandler,
    // TODO: Fix correct type.
    sessionErrorHandler as ErrorRequestHandler,
  ];
};
