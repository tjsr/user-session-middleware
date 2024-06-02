import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "./types.js";
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
import { handleAssignUserIdToRequestSessionWhenNoExistingSessionData } from "./sessionUserHandler.js";

export const userSessionMiddleware: (
  ((_req: SystemHttpRequestType<SystemSessionDataType>,
    _response: SystemHttpResponse<SessionStoreDataType>,
    _handleSessionWithNewlyGeneratedId: express.NextFunction) => void) |
  ((_err: Error,
    _req: SystemHttpRequestType<SystemSessionDataType>,
    _response: SystemHttpResponse<SessionStoreDataType>,
    _handleSessionWithNewlyGeneratedId: express.NextFunction) => void)
)[] = [
  handleSessionIdRequired,
  handleSessionWithNewlyGeneratedId,
  handleSessionDataRetrieval,
  handleNewSessionWithNoSessionData,
  handleExistingSessionWithNoSessionData,
  handleSessionCookie,
  handleSessionCookieOnError,
  handleCopySessionStoreDataToSession,
  // handleSessionsWhichRequiredData,
  handleSessionIdAfterDataRetrieval,
  handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
];
