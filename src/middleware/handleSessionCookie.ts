import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";

import { SessionIDNotGeneratedError } from "../errors/errorClasses.js";
import { addCalledHandler } from "./handlerChainLog.js";
import express from "express";
import { setSessionCookie } from './setSessionCookie.js';

export const handleSessionCookie = (
  request: SystemHttpRequestType<SystemSessionDataType>,
  response: express.Response,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleSessionCookie.name);
  if (request.sessionID === undefined) {
    console.error('Got to handleSessionCookie with undefined request.sessionID');
    const err = new SessionIDNotGeneratedError();
    next(err);
    return;
  }
  setSessionCookie(request, response);
  next();
};

export const handleSessionCookieOnError = (
  err: Error,
  request: SystemHttpRequestType<SystemSessionDataType>,
  response: express.Response,
  nextErrorHandler: express.NextFunction
) => {
  addCalledHandler(response, handleSessionCookieOnError.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookieOnError,
      'No sessionID on request when setting cookie in cookie error handler.  Something is wrong here.');
  } else {
    setSessionCookie(request, response);
  }
  nextErrorHandler(err);
};
