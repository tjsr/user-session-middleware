import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";

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
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  next: express.NextFunction
) => {
  setSessionCookie(req, res);
  next();
};

export const handleSessionCookieOnError = (
  err: Error,
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  nextErrorHandler: express.NextFunction
) => {
  setSessionCookie(req, res);
  nextErrorHandler(err);
};
