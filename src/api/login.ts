import * as EmailValidator from 'email-validator';
import * as express from '../express/index.js';

import {
  AuthenticationError,
  LoginCredentialsError,
  UnknownAuthenticationError
} from '../errors/authenticationErrorClasses.js';
import {
  EmailValidationError,
  LoginBodyFormatError,
} from '../errors/inputValidationErrorClasses.js';
import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from '../types/middlewareHandlerTypes.js';
import { addCalledHandler, verifyPrerequisiteHandler } from '../middleware/handlerChainLog.js';

import { NextFunction } from '../express/index.js';
import { RegeneratingSessionIdError } from '../errors/errorClasses.js';
import { Session } from '../express-session/index.js';
import { SystemHttpRequestType } from '../types/request.js';
import { SystemResponseLocals } from '../types/locals.js';
import { UserModel } from '../types/model.js';
import { UserSessionData } from '../types/session.js';
import { getDbUserByEmail } from '../auth/getDbUser.js';
import { handleLocalsCreation } from '../middleware/handlers/handleLocalsCreation.js';
import { saveSessionPromise } from '../sessionUser.js';

export const checkLogin: UserSessionMiddlewareRequestHandler<UserSessionData> =
  (
    request,
    response,
    next: express.NextFunction
  ): void => {
    addCalledHandler(response, checkLogin.name);
    verifyPrerequisiteHandler(response, handleLocalsCreation.name);

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

const handleAuthenticationFailure = async <SD extends UserSessionData>(
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
  });
};

const passAuthOrUnknownError = <SD extends UserSessionData>(
  locals: SystemResponseLocals<SD>, e: unknown, next: express.NextFunction): void => {
  if (e instanceof AuthenticationError) {
    locals.sendAuthenticationResult = true;
    next(e);
  } else {
    const err: UnknownAuthenticationError = new UnknownAuthenticationError(e);
    console.trace(e);
    next(err);
  }
};

export const login: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  request,
  response,
  next: express.NextFunction
) => {
  addCalledHandler(response, login.name);
  verifyPrerequisiteHandler(response, handleLocalsCreation.name);
  verifyPrerequisiteHandler(response, checkLogin.name);
  try {
    const email: string = request.body.email;
    console.debug(login, 'Processing login for valid email', email);

    getDbUserByEmail(email).then((user: UserModel) => {
      if (!user) {
        response.locals.sendAuthenticationResult = true;
        // This calls to next regardless of what happens.
        handleAuthenticationFailure(response.locals, request.session, next);
        return;
      }
      
      request.session.userId = user.userId;
      request.session.email = email;
      console.debug(login, `User ${email} logged in and has userId`, user.userId);

      response.locals.sendAuthenticationResult = true;
      response.locals.userAuthenticationData = user;
      next();
    }).catch((e: Error) => {
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
  addCalledHandler(response, regenerateAfterLoginError.name);
  verifyPrerequisiteHandler(response, checkLogin.name);
  verifyPrerequisiteHandler(response, login.name);
  regenerateAfterLoginError(undefined, request, response, next);
};

export const regenerateAfterLoginError: UserSessionMiddlewareErrorHandler<UserSessionData> = (
  error,
  request: SystemHttpRequestType,
  response,
  next: NextFunction
): void => {
  addCalledHandler(response, regenerateAfterLoginError.name);
  verifyPrerequisiteHandler(response, checkLogin.name);

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
