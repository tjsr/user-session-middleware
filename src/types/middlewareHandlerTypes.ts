/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from "express-serve-static-core";

import { SessionStoreDataType, SystemSessionDataType } from './session.js';

import { SystemHttpRequestType } from "./request.js";
import { SystemHttpResponseType } from "./response.js";
import { SystemResponseLocals } from "./locals.js";
import express from "express";

export type CustomLocalsOrRecord<SystemLocalsType> =
  SystemLocalsType extends SystemResponseLocals<infer T> ? SystemResponseLocals<T> : Record<string, any>;

export type SystemRequestOrExpressRequest<
  // SessionData extends SystemSessionDataType,
  SessionRequest,
  StoreData extends SessionStoreDataType = SessionStoreDataType,
  SessionMiddlewareLocalsType extends CustomLocalsOrRecord<SystemResponseLocals<StoreData>> =
    CustomLocalsOrRecord<SystemResponseLocals<StoreData>>,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query
> = SessionRequest extends SystemHttpRequestType ? // <SessionData, StoreData, P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType> ?
  SystemHttpRequestType : // <SessionData, StoreData, P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType> : 
  express.Request<P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType>;

export type SystemResponseOrExpressResponse<
  SessionResponse,
  StoreData extends SessionStoreDataType = SessionStoreDataType,
  ResBody = any,
  SessionMiddlewareLocalsType extends Record<string, any> = SystemResponseLocals<StoreData>, // CustomLocalsOrRecord<SystemResponseLocals<StoreData>> =
    // CustomLocalsOrRecord<SystemResponseLocals<StoreData>>
> = SessionResponse extends SystemHttpResponseType ? // <StoreData, ResBody, SessionMiddlewareLocalsType> ?
  SystemHttpResponseType : // <StoreData, ResBody, SessionMiddlewareLocalsType> :
  express.Response<ResBody, SessionMiddlewareLocalsType>;

// export interface SimpleUserSessionMiddlewareRequestHandler extends
//   RequestHandler<core.ParamsDictionary, any, any, core.Query, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>> {
//   (
//     request: SystemRequestOrExpressRequest<any, SessionStoreDataType, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>>,
//     response: SystemResponseOrExpressResponse<any, SessionStoreDataType, any, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>>,
//     next: NextFunction,
//   ): void;
// }

export interface UserSessionMiddlewareRequestHandler<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends SystemResponseLocals<StoreDataType> = SystemResponseLocals<StoreDataType>,
  // CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> =
  //   CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>
  //   ,
  // RequestType extends SystemRequestOrExpressRequest<any, StoreDataType, Locals, P, ResBody, ReqBody, ReqQuery> =
  //   SystemRequestOrExpressRequest<any, StoreDataType, Locals, P, ResBody, ReqBody, ReqQuery>,
  // ResponseType extends SystemResponseOrExpressResponse<any, StoreDataType, ResBody, Locals> =
  //   SystemResponseOrExpressResponse<any, StoreDataType, ResBody, Locals>
> extends express.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2)
  // (
  //   (
  //     request: RequestType,
  //     response: ResponseType,
  //     next: NextFunction,
  //   ): void) | (
  (
    request: SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>, // SystemRequestOrExpressRequest<RequestType, SessionStoreDataType, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>, P, ResBody, ReqBody, ReqQuery>,
    response: SystemHttpResponseType<StoreDataType, ResBody, Locals>, // SystemResponseOrExpressResponse<ResponseType, SessionStoreDataType, ResBody, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>>,
    next: express.NextFunction,
  ): void;
}

export interface UserSessionMiddlewareErrorHandler<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType, 
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends SystemResponseLocals<StoreDataType> = SystemResponseLocals<StoreDataType>,
  // CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> =
  //   CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>,
  SessionRequestType extends express.Request = SystemHttpRequestType<
    SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>,
  
  // RequestType extends SystemRequestOrExpressRequest<any, StoreDataType, Locals, P, ResBody, ReqBody, ReqQuery> =
  //   SystemRequestOrExpressRequest<any, StoreDataType, Locals, P, ResBody, ReqBody, ReqQuery>,
  ResponseType extends SystemResponseOrExpressResponse<any, StoreDataType, ResBody, Locals> =
    SystemResponseOrExpressResponse<any, StoreDataType, ResBody, Locals>
> extends express.ErrorRequestHandler {
  (
    error: Error,
    // request: SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>, // SystemRequestOrExpressRequest<RequestType, SessionStoreDataType, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>, P, ResBody, ReqBody, ReqQuery>,
    // response: SystemHttpResponseType<StoreDataType, ResBody, Locals>, // SystemResponseOrExpressResponse<ResponseType, SessionStoreDataType, ResBody, CustomLocalsOrRecord<SystemResponseLocals<SessionStoreDataType>>>,
    request: SessionRequestType,
    response: ResponseType,
    // request: RequestType,
    // response: ResponseType,
    next: express.NextFunction
  ):void;
}
