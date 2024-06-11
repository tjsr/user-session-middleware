/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from 'express-serve-static-core';

import {
  CustomLocalsOrRecord,
  SystemRequestOrExpressRequest,
  SystemResponseOrExpressResponse,
} from '../types/middlewareHandlerTypes.js';
import {
  SessionStoreDataType,
  SystemResponseLocals,
  SystemSessionDataType,
} from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import express from "express";
import { handleSessionCookieOnError } from "./handleSessionCookie.js";

// TODO: Fix type param compatibility.
export const sessionErrorHandler = //: UserSessionMiddlewareErrorHandler =
<
SessionDataType extends SystemSessionDataType = SystemSessionDataType,
StoreDataType extends SessionStoreDataType = SessionStoreDataType,
P extends core.ParamsDictionary= core.ParamsDictionary,
ResBody = any,
ReqBody = any,
ReqQuery extends core.Query = core.Query,
Locals extends CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> =
  CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>,
RequestType extends SystemRequestOrExpressRequest<
  SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery> =
  SystemRequestOrExpressRequest<SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery>,
ResponseType extends SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals> =
  SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals>
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
