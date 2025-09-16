import { AlreadyLoggedOutError, NotLoggedInError } from '../errors/authenticationErrorClasses.ts';
import { RegeneratingSessionIdError, SessionNotGeneratedError, SessionSaveError } from '../errors/errorClasses.ts';
import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler,
} from '../types/middlewareHandlerTypes.ts';
import { addCalledHandler, assertPrerequisiteHandler } from '../middleware/handlerChainLog.ts';
import express, { NextFunction } from '../express/index.ts';

import { LogoutFailedError } from '../errors/inputValidationErrorClasses.ts';
import { SystemHttpRequestType } from '../types/request.ts';
import { UserId } from '../types.ts';
import { UserSessionData } from '../types/session.ts';
import { getUserIdFromRequest } from '../auth/user.ts';
import { handleResponseLocalsCreation } from '../middleware/handlers/handleLocalsCreation.ts';
import { saveSessionPromise } from '../sessionUser.ts';

export const checkLogout: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  request,
  response,
  next: express.NextFunction
): void => {
  addCalledHandler(response, checkLogout);
  assertPrerequisiteHandler(response, handleResponseLocalsCreation);
  if (!request.session) {
    const logoutError = new LogoutFailedError(undefined, undefined, new SessionNotGeneratedError());
    console.error(logout, 'No session on request.');
    return next(logoutError);
  }

  if (request.session.hasLoggedOut) {
    const err = new AlreadyLoggedOutError();
    return next(err);
  }

  if (request.session.userId === undefined) {
    const err = new NotLoggedInError();
    return next(err);
  }

  if (request.session.email === undefined) {
    const err = new NotLoggedInError();
    return next(err);
  }

  getUserIdFromRequest(request, true)
    .then((userId: UserId | undefined) => {
      console.debug(logout, `Got logout userId ${userId}`);
      next();
    })
    .catch((err) => {
      console.error(logout, 'Error getting userId from request', err);
      next(err);
    });
};

export const logout: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  request,
  response,
  next: express.NextFunction
): void => {
  addCalledHandler(response, logout);
  assertPrerequisiteHandler(response, checkLogout);
  request.session.userId = undefined!;
  request.session.email = undefined!;
  request.session.hasLoggedOut = true;

  try {
    // Save immediately when logging out.
    saveSessionPromise(request.session)
      .then(() => {
        console.debug(logout, 'Saved session after logging out.');
        response.locals.sendAuthenticationResult = true;
        return next();
      })
      .catch((err) => {
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
  next: NextFunction
) => {
  regenerateAfterLogoutError(undefined, request, response, next);
};

export const regenerateAfterLogoutError: UserSessionMiddlewareErrorHandler<UserSessionData> = (
  error,
  request: SystemHttpRequestType,
  response,
  next: NextFunction
): void => {
  addCalledHandler(response, regenerateAfterLogoutError);
  assertPrerequisiteHandler(response, checkLogout);
  assertPrerequisiteHandler(response, logout);

  request.regenerateSessionId = true;
  request.session.regenerate((err) => {
    if (err) {
      const regenError = new RegeneratingSessionIdError(err);
      console.error(regenerateAfterLogoutError, 'Error regenerating session', err);
      return next(regenError);
    }
    console.debug(regenerateAfterLogoutError, 'Regenerated session');
    if (error) {
      next(error);
    } else {
      next();
    }
  });
};
