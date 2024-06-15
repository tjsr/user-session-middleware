import * as EmailValidator from 'email-validator';
import * as express from '../express/index.js';

import {
  AuthenticationError,
  EmailValidationError,
  UnknownAuthenticationError
} from '../errors/inputValidationErrorClasses.js';

import { AuthenticationRestResult } from '../types/apiResults.js';
import { HttpStatusCode } from '../httpStatusCodes.js';
import { SESSION_ID_HEADER_KEY } from '../getSession.js';
import { Session } from '../express-session/index.js';
import { UserModel } from '../types/model.js';
import { UserSessionData } from '../types/session.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import { getDbUserByEmail } from '../auth/user.js';

const handleAuthenticationFailure = (session: Session, next: express.NextFunction): void => {
  session.userId = undefined!;
  session.email = undefined!;
  // Let session saving be handled by the error handler.

  session.save((err: Error) => {
    if (err) {
      console.error('Failed saving session', err);
      const authErr: AuthenticationError = new AuthenticationError(err);
      next(authErr);
    } else {
      const authErr: AuthenticationError = new AuthenticationError();
      next(authErr);
      return;
    }
  });
};

const getAuthResult = (user: UserModel, session: Session, next: express.NextFunction):
  AuthenticationRestResult | undefined => {
  if (!user) {
    handleAuthenticationFailure(session, next);
    return;
  }

  const authResult: AuthenticationRestResult = {
    email: user.email,
    isLoggedIn: true,
    sessionId: session.id,
  };
  return authResult;
};

export const login: UserSessionMiddlewareRequestHandler<UserSessionData> = (
  req,
  res,
  next: express.NextFunction
) => {
  try {
    const email: string = req.body.email;
    if (!EmailValidator.validate(email)) {
      const err: EmailValidationError = new EmailValidationError('Invalid email', email);
      next(err);
      return;
    }

    getDbUserByEmail(email).then((user: UserModel) => {
      const authResult: AuthenticationRestResult|undefined = getAuthResult(user, req.session, next);
      if (authResult === undefined) {
        return;
      }
  
      // TODO: Header should be set in setCookieValue, meaning
      // this auth call must be checked before sending back the cookie.
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(SESSION_ID_HEADER_KEY, req.session.id);
      res.cookie('sessionId', req.session.id);
  
      req.session.userId = user.userId;
      req.session.email = email;
      console.log(`User ${email} logged in and has userId ${user.userId}`);

      res.status(HttpStatusCode.OK);
      res.send(authResult);
      next();
    }).catch((e: Error) => {
      const err: UnknownAuthenticationError = new UnknownAuthenticationError(e);
      console.trace(e);
      next(err);
    });
  } catch (e) {
    const err: UnknownAuthenticationError = new UnknownAuthenticationError(e);
    console.trace(e);
    next(err);
  }
};
