import { assignUserDataToRegeneratedSession, session } from './api/session.ts';
import { checkLogin, login, regenerateAfterLogin, regenerateAfterLoginError } from './api/login.js';
import { checkLogout, logout, regenerateAfterLogout, regenerateAfterLogoutError } from './api/logout.js';
import express, { ErrorRequestHandler, RequestHandler } from './express/index.js';
import {
  handleExistingSessionWithNoSessionData,
  handleLocalsCreation,
  handleSessionIdAfterDataRetrieval,
  handleSessionIdRequired,
  handleSessionStoreRequired,
  handleSessionUserBodyResults,
  handleSessionWithNewlyGeneratedId,
} from './middleware/handlers/index.ts';

import { UserSessionOptions } from './types/sessionOptions.ts';
import { expressSessionHandlerMiddleware } from './getSession.ts';
import { handleAssignUserIdToRequestSessionWhenNoExistingSessionData } from './sessionUserHandler.ts';
import { sessionErrorHandler } from './middleware/index.ts';

export const preLoginUserSessionMiddleware = (
  sessionOptions: UserSessionOptions
): (RequestHandler | ErrorRequestHandler)[] => {
  return [
    // handle /session to generate a new sessionId before anything else.
    expressSessionHandlerMiddleware(sessionOptions),
    handleLocalsCreation,
    handleSessionStoreRequired,
    handleSessionIdRequired,
    handleSessionWithNewlyGeneratedId,
    // handleSessionDataRetrieval,
    // handleNewSessionWithNoSessionData,
    handleExistingSessionWithNoSessionData,
    // handleCopySessionStoreDataToSession,
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

export const postLoginUserSessionMiddleware = (): (RequestHandler | ErrorRequestHandler)[] => {
  return [
    handleSessionIdAfterDataRetrieval,
    handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
    handleSessionUserBodyResults,
    sessionErrorHandler,
  ];
};
