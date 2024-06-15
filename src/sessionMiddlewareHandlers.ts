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
import { login } from "./api/login.js";
import { logout } from "./api/logout.js";
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
    handleSessionIdRequired as express.RequestHandler,
    handleSessionWithNewlyGeneratedId as express.RequestHandler,
    handleSessionDataRetrieval as express.RequestHandler,
    handleNewSessionWithNoSessionData as express.RequestHandler,
    handleExistingSessionWithNoSessionData as express.RequestHandler,
  ];
};

export const sessionUserRouteHandlers = (app: express.Express,
  sessionOptions?: Partial<UserSessionOptions> | undefined): void => {
  // Handle login, logout before we send back a cookie
  if (!sessionOptions?.disableSessionRefresh) {
    app.get('/session', session);
  }
  if (!sessionOptions?.disableLoginEndpoints) {
    app.get('/login', login);
    app.post('/login', login);
    app.get('/logout', logout);
    app.post('/logout', logout);
  }
};

export const postLoginUserSessionMiddleware = (): (
  RequestHandler | ErrorRequestHandler
)[] => {
  return [
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
