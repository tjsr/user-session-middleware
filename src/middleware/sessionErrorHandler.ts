import { AssertionError } from 'node:assert';
import { NextFunction } from 'express';
import { SessionHandlerError } from '../errors/SessionHandlerError.js';
import { UserSessionMiddlewareErrorHandler } from '../types/middlewareHandlerTypes.js';
import { addCalledHandler } from './handlerChainLog.js';
import { sendAuthResultBody } from './handlers/index.js';

export const sessionErrorHandler: UserSessionMiddlewareErrorHandler = (
  error,
  request,
  response,
  next: NextFunction
) => {
  addCalledHandler(response, sessionErrorHandler);

  if (SessionHandlerError.isType(error) || error instanceof SessionHandlerError) {
    if (response.locals.sendAuthenticationResult) {
      response.status(error.status);
      sendAuthResultBody(request.session, response);
    } else {
      const sessionError: SessionHandlerError = error as SessionHandlerError;
      response.status(sessionError.status);
      response.json({ message: sessionError.message });
      console.error(sessionErrorHandler, 'Session error', sessionError);
    }
  } else if (error instanceof AssertionError) {
    console.error(sessionErrorHandler, 'Got assertion error', error);
  } else if (error.name) {
    console.warn('Got error of type with name', error.name, error);
  }
  next(error);
};
