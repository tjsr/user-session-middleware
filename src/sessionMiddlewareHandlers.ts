import { assignUserDataToRegeneratedSession, session } from './api/session.js';
import { checkLogin, login, regenerateAfterLogin, regenerateAfterLoginError } from "./api/login.js";
import { checkLogout, logout, regenerateAfterLogout, regenerateAfterLogoutError } from "./api/logout.js";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import { handleSessionCookie, handleSessionCookieOnError } from "./middleware/handlers/handleSessionCookie.js";

import {
  UserSessionOptions
} from "./types/sessionOptions.js";
import { expressSessionHandlerMiddleware } from "./getSession.js";
import { handleAssignUserIdToRequestSessionWhenNoExistingSessionData } from "./sessionUserHandler.js";
import { handleCopySessionStoreDataToSession } from './middleware/handlers/handleCopySessionStoreDataToSession.js';
import {
  handleExistingSessionWithNoSessionData
} from './middleware/handlers/handleExistingSessionWithNoSessionData.js';
import { handleLocalsCreation } from "./middleware/handlers/handleLocalsCreation.js";
import {
  handleNewSessionWithNoSessionData
} from './middleware/handlers/handleSessionWithNoData.js';
import { handleSessionDataRetrieval } from "./middleware/handlers/handleSessionDataRetrieval.js";
import { handleSessionIdAfterDataRetrieval } from "./middleware/handlers/handleSessionIdAfterDataRetrieval.js";
import { handleSessionIdRequired } from "./middleware/handlers/handleSessionIdRequired.js";
import { handleSessionStoreRequired } from "./middleware/handlers/handleSessionStoreRequired.js";
import { handleSessionUserBodyResults } from "./middleware/handlers/handleSessionUserBodyResults.js";
import { handleSessionWithNewlyGeneratedId } from './middleware/handlers/handleSessionWithNewlyGeneratedId.js';
import { sessionErrorHandler } from './middleware/sessionErrorHandler.js';

export const preLoginUserSessionMiddleware = (sessionOptions?: Partial<UserSessionOptions> | undefined): (
    RequestHandler | ErrorRequestHandler
)[] => {
  const expressSessionOptions: Partial<UserSessionOptions> = { ...sessionOptions };

  return [
    // handle /session to generate a new sessionId before anything else.
    expressSessionHandlerMiddleware(expressSessionOptions),
    handleLocalsCreation,
    handleSessionStoreRequired,
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
    app.get(sessionOptions?.sessionPath ?? '/session', session, assignUserDataToRegeneratedSession);
  }
  if (!sessionOptions?.disableLoginEndpoints) {
    // express.json will be required if we are going to use req.body for /login
    app.use(express.json()),
    app.get(sessionOptions?.loginPath ?? '/login', checkLogin, login,
      regenerateAfterLogin, regenerateAfterLoginError);
    app.post(sessionOptions?.loginPath ?? '/login', checkLogin, login,
      regenerateAfterLogin, regenerateAfterLoginError
    );
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
