/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from "express-serve-static-core";
import * as express from '../express/index.ts';

import { SystemHttpRequestType } from './request.js';
import { SystemHttpResponseType } from './response.js';
import { SystemResponseLocals } from './locals.js';
import { UserSessionData } from './session.ts';

export interface UserSessionMiddlewareRequestHandler<
  SD extends UserSessionData = UserSessionData,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends SystemResponseLocals = SystemResponseLocals<SD>,
  RequestType extends express.Request = SystemHttpRequestType<
    SD, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends express.Response = SystemHttpResponseType<SD, ResBody, Locals>
> extends express.RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  (
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction,
  ): void;
}

export interface UserSessionMiddlewareErrorHandler<
  SD extends UserSessionData = UserSessionData, 
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends SystemResponseLocals = SystemResponseLocals<SD>,
  RequestType extends express.Request = SystemHttpRequestType<
    SD, P, ResBody, ReqBody, ReqQuery, Locals>,  
  ResponseType extends express.Response = SystemHttpResponseType<SD, ResBody, Locals>
> extends express.ErrorRequestHandler<
    P,
    ResBody,
    ReqBody,
    ReqQuery,
    Locals>{
  (
    error: Error,
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ):void;
}
