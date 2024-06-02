import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";

import { addCalledHandler } from "./handlerChainLog.js";
import assert from "assert";
import express from "express";

export const setSessionCookie = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response
) => {
  console.debug(handleSessionCookieOnError, `Setting session cookie to ${req.sessionID}.`);
  assert(req.session !== undefined);
  assert(req.session.id !== undefined);
  res.set('Set-Cookie', `sessionId=${req.sessionID}`);
};

export const handleSessionCookie = (
  request: SystemHttpRequestType<SystemSessionDataType>,
  response: express.Response,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleSessionCookie.name);
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
  setSessionCookie(request, response);
  nextErrorHandler(err);
};
