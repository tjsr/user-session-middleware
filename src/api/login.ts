import * as EmailValidator from 'email-validator';
import * as express from '../express/index.js';

import {
  EmailValidationError,
  LoginBodyFormatError,
} from '../errors/inputValidationErrorClasses.js';
import {
  LoginCredentialsError,
  UnknownAuthenticationError
} from '../errors/authenticationErrorClasses.js';
import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from '../types/middlewareHandlerTypes.js';
import { addCalledHandler, assertPrerequisiteHandler } from '../middleware/handlerChainLog.js';

import { NextFunction } from '../express/index.js';
import { RegeneratingSessionIdError } from '../errors/errorClasses.js';
import { Session } from '../express-session/index.js';
import { SystemHttpRequestType } from '../types/request.js';
import { SystemResponseLocals } from '../types/locals.js';
import { UserSessionData } from '../types/session.js';
import { handleLocalsCreation } from '../middleware/handlers/handleLocalsCreation.js';
import { passAuthOrUnknownError } from '../auth/authErrorUtils.js';
import { retrieveUserDataForSession } from '../auth/retrieveUserDataForSession.js';
import { saveSessionPromise } from '../sessionUser.js';

export const checkLogin: UserSessionMiddlewareRequestHandler<UserSessionData> =
  (
    request,
    response,
    next: express.NextFunction
  ): void => {
    addCalledHandler(response, checkLogin);
    assertPrerequisiteHandler(response, handleLocalsCreation);

    const email: string = request.body.email;
    if (request.body === undefined) {
      const err: LoginBodyFormatError = new LoginBodyFormatError('No body on login request');
      console.debug('No body on login request', err);
      next(err);
      return;
    }

    if (!EmailValidator.validate(email)) {
      const err: EmailValidationError = new EmailValidationError('Invalid email on login', email);
      console.debug('Invalid email on login', err);
      next(err);
      return;
    }
    next();
  };

export const handleLoginAuthenticationFailure = async <SD extends UserSessionData>(
  locals: SystemResponseLocals<SD>, session: Session, next: express.NextFunction): Promise<void> => {
  session.userId = undefined!;
  session.email = undefined!;
  // Let session saving be handled by the error handler.

  return saveSessionPromise(session).then(() => {
    const authErr: LoginCredentialsError = new LoginCredentialsError();
    locals.sendAuthenticationResult = true;
    next(authErr);
    return;
  }).catch((err) => {
    console.error('Failed saving session', err);
    const authErr: UnknownAuthenticationError = new UnknownAuthenticationError(err);
    next(authErr);
    return;
  });
};

export const login: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  request,
  response,
  next: express.NextFunction
) => {
  addCalledHandler(response, login);
  assertPrerequisiteHandler(response, handleLocalsCreation);
  assertPrerequisiteHandler(response, checkLogin);
  const email: string = request.body.email;
  console.debug(login, 'Processing login for valid email', email);
  try {
    retrieveUserDataForSession(email, request.session, response.locals, next)
      .catch((e: Error) => {
        passAuthOrUnknownError(response.locals, e, next);
      });
  } catch (e: unknown) {
    passAuthOrUnknownError(response.locals, e, next);
  }
};

export const regenerateAfterLogin: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  request: SystemHttpRequestType,
  response,
  next: NextFunction
) => {
  addCalledHandler(response, regenerateAfterLoginError);
  assertPrerequisiteHandler(response, checkLogin);
  assertPrerequisiteHandler(response, login);
  regenerateAfterLoginError(undefined, request, response, next);
};

export const regenerateAfterLoginError: UserSessionMiddlewareErrorHandler<UserSessionData> = (
  error,
  request: SystemHttpRequestType,
  response,
  next: NextFunction
): void => {
  addCalledHandler(response, regenerateAfterLoginError);
  assertPrerequisiteHandler(response, checkLogin);

  const originalSessionId = request.session.id;
  request.regenerateSessionId = true;
  request.session.regenerate((err) => {
    if (err) {
      const regenError = new RegeneratingSessionIdError(err);
      console.error(regenerateAfterLoginError, 'Error regenerating session', err);
      return next(regenError);
    }
    console.debug(regenerateAfterLoginError, 'Regenerated session');
    if (error) {
      next(error);
    } else {
      console.debug(regenerateAfterLoginError, 'Regenerated session ID', originalSessionId, '=>', request.session.id);
      Object.assign(request.session, response.locals.userAuthenticationData);
      next();
    }
  });
};
