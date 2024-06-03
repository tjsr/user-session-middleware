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
  request.session.save((saveErr) => {
    if (saveErr) {
      console.error(handleSessionCookieOnError, 'Error saving session in handleSessionCookie', saveErr);
      nextErrorHandler(saveErr);
      return;
    }
    console.log(handleSessionCookieOnError, `Saved session ${request.sessionID} set in error handler.`);
    nextErrorHandler(err);
  });
};
