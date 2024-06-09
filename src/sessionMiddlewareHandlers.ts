import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType,
  UserSessionOptions
} from "./types.js";
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

import express from "express";
import { expressSessionHandlerMiddleware } from "./getSession.js";
import { handleAssignUserIdToRequestSessionWhenNoExistingSessionData } from "./sessionUserHandler.js";
import { sessionErrorHandler } from './middleware/sessionErrorHandler.js';

export const userSessionMiddleware = (sessionOptions?: Partial<UserSessionOptions> | undefined): (
  ((_req: SystemHttpRequestType<SystemSessionDataType>,
    _response: SystemHttpResponseType<SessionStoreDataType>,
    _handleSessionWithNewlyGeneratedId: express.NextFunction) => void) |
  ((_err: Error,
    _req: SystemHttpRequestType<SystemSessionDataType>,
    _response: SystemHttpResponseType<SessionStoreDataType>,
    _handleSessionWithNewlyGeneratedId: express.NextFunction) => void)
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
