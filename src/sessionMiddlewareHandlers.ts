import { assignUserDataToRegeneratedSession, session } from './api/session.js';
import { checkLogin, login, regenerateAfterLogin, regenerateAfterLoginError } from "./api/login.js";
import { checkLogout, logout, regenerateAfterLogout, regenerateAfterLogoutError } from "./api/logout.js";
import express, { ErrorRequestHandler, RequestHandler } from "./express/index.js";
import {
  handleCopySessionStoreDataToSession,
  handleExistingSessionWithNoSessionData,
  handleLocalsCreation,
  handleNewSessionWithNoSessionData,
  handleSessionCookie,
  handleSessionCookieOnError,
  handleSessionDataRetrieval,
  handleSessionIdAfterDataRetrieval,
  handleSessionIdRequired,
  handleSessionStoreRequired,
  handleSessionUserBodyResults,
  handleSessionWithNewlyGeneratedId
} from './middleware/handlers/index.js';

import {
  UserSessionOptions
} from "./types/sessionOptions.js";
import { expressSessionHandlerMiddleware } from "./getSession.js";
import { handleAssignUserIdToRequestSessionWhenNoExistingSessionData } from "./sessionUserHandler.js";
import { sessionErrorHandler } from './middleware/index.js';

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

export const sessionUserRouteHandlers = (
  app: express.Application,
  sessionOptions?: Partial<UserSessionOptions> | undefined
): void => {
  // Handle login, logout before we send back a cookie
  if (!sessionOptions?.disableSessionRefresh) {
    app.get(sessionOptions?.sessionPath ?? '/session', session, assignUserDataToRegeneratedSession);
  }
  if (!sessionOptions?.disableLoginEndpoints) {
    // express.json will be required if we are going to use req.body for /login
    app.use(express.json());
    app.get(sessionOptions?.loginPath ?? '/login', checkLogin, login, regenerateAfterLogin, regenerateAfterLoginError);
    app.post(sessionOptions?.loginPath ?? '/login', checkLogin, login, regenerateAfterLogin, regenerateAfterLoginError);
    app.get(
      sessionOptions?.logoutPath ?? '/logout',
      checkLogout,
      logout,
      regenerateAfterLogout,
      regenerateAfterLogoutError
    );
    app.post(
      sessionOptions?.logoutPath ?? '/logout',
      checkLogout,
      logout,
      regenerateAfterLogout,
      regenerateAfterLogoutError
    );
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
