import {
  AlreadyLoggedOutError,
  LogoutFailedError,
  NotLoggedInError,
  RegeneratingSessionIdError,
  SessionNotGeneratedError,
  SessionSaveError
} from '../errors/errorClasses.js';
import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from '../types/middlewareHandlerTypes.js';
import { addCalledHandler, verifyPrerequisiteHandler } from '../middleware/handlerChainLog.js';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { SystemHttpRequestType } from '../types/request.js';
import { UserId } from '../types.js';
import { UserSessionData } from '../types/session.js';
import express from 'express';
import { getUserIdFromRequest } from '../auth/user.js';
import { handleCopySessionStoreDataToSession } from '../middleware/storedSessionData.js';
import { handleLocalsCreation } from '../middleware/handleLocalsCreation.js';
import { saveSessionPromise } from '../sessionUser.js';

export const checkLogout: UserSessionMiddlewareRequestHandler<UserSessionData> =
  (
    request,
    response,
    next: express.NextFunction
  ): void => {
    addCalledHandler(response, checkLogout.name);
    verifyPrerequisiteHandler(response, handleLocalsCreation.name);
    if (!request.session) {
      const logoutError = new LogoutFailedError(undefined, undefined, new SessionNotGeneratedError());
      console.error(logout, 'No session on request.');
      return next(logoutError);
    }

    if (request.session.hasLoggedOut) {
      const err = new AlreadyLoggedOutError();
      console.debug(logout, 'Session is already logged out', err);
      return next(err);
    }

    if (request.session.userId === undefined) {
      const err = new NotLoggedInError();
      console.debug(logout, 'Session has no userId', err);
      return next(err);
    }

    if (request.session.email === undefined) {
      const err = new NotLoggedInError();
      console.debug(logout, 'Session is not logged in', err);
      return next(err);
    }

    getUserIdFromRequest(request, true).then((userId: UserId|undefined) => {
      console.debug(logout, `Got logout userId ${userId}`);
      next();
    }).catch((err) => {
      console.error(logout, 'Error getting userId from request', err);
      next(err);
    });
  };

export const logout: UserSessionMiddlewareRequestHandler<UserSessionData> =
  (
    request,
    response,
    next: express.NextFunction
  ): void => {
    addCalledHandler(response, logout.name);
    verifyPrerequisiteHandler(response, checkLogout.name);
    verifyPrerequisiteHandler(response, handleCopySessionStoreDataToSession.name);
    request.session.userId = undefined!;
    request.session.email = undefined!;
    request.session.hasLoggedOut = true;

    try {
      // Save immediately when logging out.
      saveSessionPromise(request.session).then(() => {
        console.debug(logout, 'Saved session after logging out.');
        response.locals.sendAuthenticationResult = true;
        return next();
      }).catch((err) => {
        const logoutErr = new LogoutFailedError(undefined, undefined, new SessionSaveError(err));
        console.error(logout, 'Failed saving session', logoutErr, err);
        return next(logoutErr);
      });
    } catch (err) {
      const errLogout = new LogoutFailedError(undefined, undefined, err);
      return next(errLogout);
    }
  };

export const regenerateAfterLogout: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  request: SystemHttpRequestType,
  response,
  next
) => {
  addCalledHandler(response, regenerateAfterLogout.name);
  verifyPrerequisiteHandler(response, checkLogout.name);
  verifyPrerequisiteHandler(response, logout.name);

  request.regenerateSessionId = true;
  request.session.regenerate((err) => {
    if (err) {
      const regenError = new RegeneratingSessionIdError(err);
      console.error(regenerateAfterLogout, 'Error regenerating session', err);
      response.status(HttpStatusCode.INTERNAL_SERVER_ERROR);
      return next(regenError);
    }
    console.debug(regenerateAfterLogout, 'Regenerated session');
    next();
  });
};

export const regenerateAfterLogoutError: UserSessionMiddlewareErrorHandler<UserSessionData> = (
  error,
  request: SystemHttpRequestType,
  response,
  nextErrorHandler
): void => {
  addCalledHandler(response, regenerateAfterLogoutError.name);
  verifyPrerequisiteHandler(response, checkLogout.name);
  verifyPrerequisiteHandler(response, logout.name);

  request.regenerateSessionId = true;
  request.session.regenerate((err) => {
    if (err) {
      const regenError = new RegeneratingSessionIdError(err);
      console.error(regenerateAfterLogoutError, 'Error regenerating session', err);
      response.status(HttpStatusCode.INTERNAL_SERVER_ERROR);
      return nextErrorHandler(regenError);
    }
    console.debug(regenerateAfterLogoutError, 'Regenerated session');
    nextErrorHandler(error);
  });
};
