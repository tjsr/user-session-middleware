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
  SessionRequest,
  StoreData extends SessionStoreDataType = SessionStoreDataType,
  SessionMiddlewareLocalsType extends CustomLocalsOrRecord<SystemResponseLocals<StoreData>> =
    CustomLocalsOrRecord<SystemResponseLocals<StoreData>>,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query
> = SessionRequest extends SystemHttpRequestType ?
  SessionRequest :
  express.Request<P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType>;

export type SystemResponseOrExpressResponse<
  SessionResponse,
  StoreData extends SessionStoreDataType = SessionStoreDataType,
  ResBody = any,
  SessionMiddlewareLocalsType extends Record<string, any> = SystemResponseLocals<StoreData>,
> = SessionResponse extends SystemHttpResponseType ?
  SessionResponse :
  express.Response<ResBody, SessionMiddlewareLocalsType>;

export interface UserSessionMiddlewareRequestHandler<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends SystemResponseLocals<StoreDataType> = SystemResponseLocals<StoreDataType>,
  RequestType extends express.Request = SystemHttpRequestType<
    SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>,  
  ResponseType extends express.Response = SystemHttpResponseType<StoreDataType, ResBody, Locals>
> extends express.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  (
    request: RequestType,
    response: ResponseType,
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
  RequestType extends express.Request = SystemHttpRequestType<
    SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>,  
  ResponseType extends express.Response = SystemHttpResponseType<StoreDataType, ResBody, Locals>
> extends express.ErrorRequestHandler {
  (
    error: Error,
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ):void;
}
