/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from 'express-serve-static-core';

import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemResponseLocals,
  SystemSessionDataType,
} from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import express from "express";
import { handleSessionCookieOnError } from "./handleSessionCookie.js";

// TODO: Fix type param compatibility.
export const sessionErrorHandler = <// : UserSessionMiddlewareErrorHandler = <
ApplicationSessionType extends SystemSessionDataType = SystemSessionDataType,
ApplicationStoreType extends SessionStoreDataType = SessionStoreDataType,
P = core.ParamsDictionary,
ResBody = any,
ReqBody = any,
ReqQuery = core.Query,
Locals extends Record<string, any> | SystemResponseLocals<ApplicationStoreType> =
  Record<string, any> | SystemResponseLocals<ApplicationStoreType>,
RequestType extends
// TODO: SHRT | express.Response doesn't mean extends either of these, it means extends a type which is (X|Y)
  SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals> |
    express.Request<P, ResBody, ReqBody, ReqQuery, Locals> =
  SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
ResponseType extends SystemHttpResponseType<ApplicationStoreType, ResBody, Locals> | express.Response<ResBody, Locals> =
  SystemHttpResponseType<ApplicationStoreType, ResBody, Locals>
>(
    error: Error | SessionHandlerError,
    _request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, sessionErrorHandler.name);
  verifyPrerequisiteHandler(response, handleSessionCookieOnError.name);

  if (SessionHandlerError.isType(error)) {
    const sessionError: SessionHandlerError = error as SessionHandlerError;
    response.status(sessionError.status);
    // TODO: Don't cast as ResBody
    response.json({ message: sessionError.message } as ResBody);
  }
  next(error);
};
