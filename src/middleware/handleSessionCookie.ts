/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.js";

import { SessionIDNotGeneratedError } from '../errors/errorClasses.js';
import { SystemHttpRequestType } from '../types/request.js';
import { SystemHttpResponseType } from "../types/response.js";
import { addCalledHandler } from "./handlerChainLog.js";
import express from "express";
import { setSessionCookie } from './setSessionCookie.js';

export const handleSessionCookie: UserSessionMiddlewareRequestHandler =
(
  request,
  response,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleSessionCookie.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookie, 'Got to handleSessionCookie with undefined request.sessionID');
    const err = new SessionIDNotGeneratedError();
    next(err);
    return;
  }
  setSessionCookie(request as SystemHttpRequestType, response);
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

// TODO: Fix type param compatibility.
export const handleSessionCookieOnError: UserSessionMiddlewareErrorHandler =
(
  error: Error,
  request,
  response,
  nextErrorHandler: express.NextFunction
):void => {
  // TODO: Fix forced type here
  addCalledHandler(response as SystemHttpResponseType, handleSessionCookieOnError.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookieOnError,
      'No sessionID on request when setting cookie in cookie error handler.  Something is wrong here.');
  } else {
    // TODO: Remove need to cast here.
    setSessionCookie(request as express.Request, response as express.Response);
  }
  request.session.save((saveErr) => {
    if (saveErr) {
      console.error(handleSessionCookieOnError, 'Error saving session in handleSessionCookie', saveErr);
      nextErrorHandler(saveErr);
      return;
    }
    console.log(handleSessionCookieOnError, `Saved session ${request.sessionID} set in error handler.`);
    nextErrorHandler(error);
  });
};
