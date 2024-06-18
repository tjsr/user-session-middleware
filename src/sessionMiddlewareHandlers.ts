import { checkLogout, logout, regenerateAfterLogout, regenerateAfterLogoutError } from "./api/logout.js";
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
import { handleLocalsCreation } from "./middleware/handleLocalsCreation.js";
import { handleSessionUserBodyResults } from "./middleware/handleSessionUserBodyResults.js";
import { login } from "./api/login.js";
import { session } from './api/session.js';
import { sessionErrorHandler } from './middleware/sessionErrorHandler.js';

export const preLoginUserSessionMiddleware = (sessionOptions?: Partial<UserSessionOptions> | undefined): (
    RequestHandler | ErrorRequestHandler
)[] => {
  const expressSessionOptions: Partial<UserSessionOptions> = { ...sessionOptions };

  return [
    // handle /session to generate a new sessionId before anything else.
    expressSessionHandlerMiddleware(expressSessionOptions),
    handleLocalsCreation,
    handleSessionIdRequired,
    handleSessionWithNewlyGeneratedId,
    handleSessionDataRetrieval,
    handleNewSessionWithNoSessionData,
    handleExistingSessionWithNoSessionData,
    handleCopySessionStoreDataToSession,
  ];
};

export const sessionUserRouteHandlers = (app: express.Express,
  sessionOptions?: Partial<UserSessionOptions> | undefined): void => {
  // Handle login, logout before we send back a cookie
  if (!sessionOptions?.disableSessionRefresh) {
    app.get(sessionOptions?.sessionPath ?? '/session', session);
  }
  if (!sessionOptions?.disableLoginEndpoints) {
    app.get(sessionOptions?.loginPath ?? '/login', login);
    app.post(sessionOptions?.loginPath ?? '/login', login);
    app.get(sessionOptions?.logoutPath ?? '/logout', checkLogout, logout,
      regenerateAfterLogout, regenerateAfterLogoutError);
    app.post(sessionOptions?.logoutPath ?? '/logout', checkLogout, logout,
      regenerateAfterLogout, regenerateAfterLogoutError);
  }
};

export const postLoginUserSessionMiddleware = (): (
  RequestHandler | ErrorRequestHandler
)[] => {
  return [
    handleSessionCookie,
    handleSessionCookieOnError,
    handleSessionIdAfterDataRetrieval,
    handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
    handleSessionUserBodyResults,
    sessionErrorHandler,
  ];
};
