/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as core from "express-serve-static-core";

import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemResponseLocals,
  SystemSessionDataType
} from "../types.js";
import express, { NextFunction, RequestHandler } from "express";

export interface UserSessionMiddlewareErrorHandler<
SessionDataType extends SystemSessionDataType = SystemSessionDataType,
StoreDataType extends SessionStoreDataType = SessionStoreDataType, 
P = core.ParamsDictionary,
ResBody = any,
ReqBody = any,
ReqQuery = core.Query,
Locals extends Record<string, any> | SystemResponseLocals<StoreDataType> =
  Record<string, any> | SystemResponseLocals<StoreDataType>,
RequestType extends SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals> |
  express.Request<P, ResBody, ReqBody, ReqQuery, Locals> =
  SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>,
ResponseType extends SystemHttpResponseType<StoreDataType, ResBody, Locals> |
  express.Response<ResBody, Locals> = 
  SystemHttpResponseType<StoreDataType, ResBody, Locals>
> extends express.ErrorRequestHandler {
  error: Error,
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
}

export interface UserSessionMiddlewareRequestHandler<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType, 
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> | SystemResponseLocals<StoreDataType> =
    Record<string, any> | SystemResponseLocals<StoreDataType>,
  RequestType extends SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals> |
    express.Request<P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<StoreDataType, ResBody, Locals> |
    express.Response<ResBody, Locals> =
    SystemHttpResponseType<StoreDataType, ResBody, Locals>
> extends
    RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
      // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
      requst: RequestType,
      response: ResponseType,
      next: NextFunction,
  ): void;
}
