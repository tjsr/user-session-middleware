/* eslint-disable @typescript-eslint/no-explicit-any */

import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { NextFunction } from "express";
import { SessionHandlerError } from "../errors/SessionHandlerError.js";
import { SystemHttpResponseType } from '../types/response.js';
import {
  UserSessionMiddlewareErrorHandler,
} from '../types/middlewareHandlerTypes.js';
import { handleSessionCookieOnError } from "./handleSessionCookie.js";

// TODO: Fix type param compatibility.
export const sessionErrorHandler: UserSessionMiddlewareErrorHandler =
// <
// SessionDataType extends SystemSessionDataType = SystemSessionDataType,
// StoreDataType extends SessionStoreDataType = SessionStoreDataType,
// P extends core.ParamsDictionary= core.ParamsDictionary,
// ResBody = any,
// ReqBody = any,
// ReqQuery extends core.Query = core.Query,
// Locals extends CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> =
//   CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>,
// RequestType extends SystemRequestOrExpressRequest<
//   SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery> =
//   SystemRequestOrExpressRequest<SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery>,
// ResponseType extends SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals> =
//   SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals>
// >(
(
  error,
  _req,
  response,
  next: NextFunction
) => {
  addCalledHandler(response as SystemHttpResponseType, sessionErrorHandler.name);
  verifyPrerequisiteHandler(response as SystemHttpResponseType, handleSessionCookieOnError.name);

  if (SessionHandlerError.isType(error)) {
    const sessionError: SessionHandlerError = error as SessionHandlerError;
    response.status(sessionError.status);
    // TODO: Don't cast as ResBody
    response.json({ message: sessionError.message });
  }
  next(error);
};
