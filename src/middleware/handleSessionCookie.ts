/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.js";

import { NextFunction } from "../express/index.js";
import { SessionIDNotGeneratedError } from '../errors/errorClasses.js';
import { SystemHttpRequestType } from "../types/request.js";
import { addCalledHandler } from "./handlerChainLog.js";
import { setSessionCookie } from './setSessionCookie.js';

export const handleSessionCookie: UserSessionMiddlewareRequestHandler =
(
  request: SystemHttpRequestType,
  response,
  next: NextFunction
) => {
  addCalledHandler(response, handleSessionCookie.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookie, 'Got to handleSessionCookie with undefined request.sessionID');
    const err = new SessionIDNotGeneratedError();
    next(err);
    return;
  }
  setSessionCookie(request, response);
  request.session.save((err) => {
    if (err) {
      console.error(handleSessionCookie, 'Error saving session in handleSessionCookie', err);
      next(err);
      return;
    }
    console.log(handleSessionCookie, `Saved session ${request.sessionID} set in cookie handler.`);
    next();
  });
};

export const handleSessionCookieOnError: UserSessionMiddlewareErrorHandler =
(
  error: Error,
  request,
  response,
  nextErrorHandler: NextFunction
):void => {
  addCalledHandler(response, handleSessionCookieOnError.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookieOnError,
      'No sessionID on request when setting cookie in cookie error handler.  Something is wrong here.');
  } else {
    setSessionCookie(request, response);
  }
  request.session.save((saveErr) => {
    if (saveErr) {
      console.error(handleSessionCookieOnError, 'Error saving session in handleSessionCookie', saveErr);
      nextErrorHandler(saveErr);
      return;
    }
    console.error(handleSessionCookieOnError, `Saved session ${request.sessionID} set in error handler.`, error);
    nextErrorHandler(error);
  });
};
