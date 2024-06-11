/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as core from "express-serve-static-core";

import {
  HandlerName,
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType
} from "../types.js";
import express, { NextFunction, RequestHandler } from "express";

import { SessionHandlerError } from "../errors/SessionHandlerError.js";

export interface UserSessionMiddlewareErrorHandler<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType, 
  ResBody = any,
  Locals extends CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> =
    CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>,
  RequestType extends SystemRequestOrExpressRequest<SessionDataType, StoreDataType, any, Locals> =
    SystemRequestOrExpressRequest<SessionDataType, StoreDataType, any, Locals>,
  ResponseType extends SystemResponseOrExpressResponse<StoreDataType, any, ResBody, Locals> =
    SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals>
> extends express.ErrorRequestHandler {
  error: Error | SessionHandlerError,
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
}

export interface SystemResponseLocals<StoreData extends SessionStoreDataType> extends Record<string, any> {
  calledHandlers: HandlerName[];
  retrievedSessionData: StoreData | undefined;
  skipHandlerDependencyChecks: boolean;
}

export type CustomLocalsOrRecord<SystemLocalsType> =
  SystemLocalsType extends SystemResponseLocals<infer T> ? SystemResponseLocals<T> : Record<string, any>;

export type SystemRequestOrExpressRequest<
  SessionData extends SystemSessionDataType,
  StoreData extends SessionStoreDataType,
  SessionRequest,
  SessionMiddlewareLocalsType extends CustomLocalsOrRecord<SystemResponseLocals<StoreData>> =
    CustomLocalsOrRecord<SystemResponseLocals<StoreData>>,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query
> = SessionRequest extends SystemHttpRequestType<SessionData, StoreData, P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType> ?
  SystemHttpRequestType<SessionData, StoreData, P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType> : 
  express.Request<P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType>;

export type SystemResponseOrExpressResponse<
  StoreData extends SessionStoreDataType,
  SessionResponse,
  ResBody = any,
  SessionMiddlewareLocalsType extends CustomLocalsOrRecord<SystemResponseLocals<StoreData>> =
    CustomLocalsOrRecord<SystemResponseLocals<StoreData>>
> = SessionResponse extends SystemHttpResponseType<StoreData, ResBody, SessionMiddlewareLocalsType> ?
  SystemHttpResponseType<StoreData, ResBody, SessionMiddlewareLocalsType> :
  express.Response<ResBody, SessionMiddlewareLocalsType>;

export interface UserSessionMiddlewareRequestHandler<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType, 
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> =
    CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>,
  RequestType extends SystemRequestOrExpressRequest<SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery> =
    SystemRequestOrExpressRequest<SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery>,
  ResponseType extends SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals> =
    SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals>
> extends
    RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
      // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
    (
      request: RequestType,
      response: ResponseType,
      next: NextFunction,
  ): void;
}
