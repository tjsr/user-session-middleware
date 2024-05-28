import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";
import express, { NextFunction } from "express";
import {
  handleCopySessionStoreDataToSession,
  handleSessionDataRetrieval,
  handleSessionWithNoSessionData,
  handleSessionsWhichRequiredData
} from "./middleware/storedSessionData.js";
import { handleSessionCookie, handleSessionCookieOnError } from "./middleware/setSessionCookie.js";
import {
  handleSessionIdAfterDataRetrieval,
  handleSessionIdRequired,
  handleSessionWithNewlyGeneratedId
} from "./middleware/handleSessionId.js";

export const userSessionMiddleware: (
  ((_req: SystemHttpRequestType<SystemSessionDataType>,
    _res: express.Response,
    _handleSessionWithNewlyGeneratedId: NextFunction) => void) |
  ((_err: Error,
    _req: SystemHttpRequestType<SystemSessionDataType>,
    _res: express.Response,
    _handleSessionWithNewlyGeneratedId: NextFunction) => void)
)[] = [
  handleSessionIdRequired,
  handleSessionWithNewlyGeneratedId,
  handleSessionDataRetrieval,
  handleSessionCookie,
  handleSessionCookieOnError,
  handleSessionWithNoSessionData,
  handleSessionsWhichRequiredData,
  handleSessionIdAfterDataRetrieval,
  handleCopySessionStoreDataToSession,
];
