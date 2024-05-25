import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";

import assert from "assert";
import { assignUserIdToRequestSession } from "./sessionUser.js";
import express from "express";

export const assignUserIdToRequestSessionHandler = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  _res: express.Response,
  next: express.NextFunction
) => {
  assignUserIdToRequestSession(req, next);
};

export const setSessionCookie = (
  err: Error,
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  next: express.NextFunction) => {
  console.debug(`Setting session cookie to ${req.sessionID}.`);
  assert(req.session !== undefined);
  assert(req.session.id !== undefined);
  res.set('Set-Cookie', `sessionId=${req.sessionID}`);
  next(err);
};
