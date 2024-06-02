import { SystemHttpRequestType, SystemSessionDataType } from "../types.ts";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.ts";
import express, { NextFunction } from "express";
import { handleSessionCookie, handleSessionCookieOnError } from "./handleSessionCookie.ts";

import { HttpStatusCode } from "../httpStatusCodes.ts";

export const endRequest = (
  _req: SystemHttpRequestType<SystemSessionDataType>,
  response: express.Response,
  _next: NextFunction
) => {
  addCalledHandler(response, endRequest.name);
  verifyPrerequisiteHandler(response, handleSessionCookie.name);
  response.send();
  response.end();
};

export const endErrorRequest = (
  err: Error,
  _req: SystemHttpRequestType<SystemSessionDataType>,
  response: express.Response,
  _next: NextFunction
) => {
  addCalledHandler(response, endErrorRequest.name);
  console.warn(endErrorRequest, 'Got end error request', err, response.statusCode);
  try {
    verifyPrerequisiteHandler(response, handleSessionCookieOnError.name);
    response.sendStatus(response.statusCode);
  } catch (err) {
    response.sendStatus(HttpStatusCode.NOT_IMPLEMENTED);
  }
  response.end();
};
