/* eslint-disable @typescript-eslint/no-explicit-any */
import * as core from "express-serve-static-core";

import { SessionData } from "./express.js";
import { SystemHttpRequestType } from "./request.js";
import { SystemHttpResponseType } from "./response.js";
import { SystemResponseLocals } from "./locals.js";
import { UserSessionData } from "./session.js";
import express from "express";

export type SystemRequestOrExpressRequest<
  SessionRequest,
  SD extends UserSessionData = UserSessionData,
  SessionMiddlewareLocalsType extends Record<string, any> = SystemResponseLocals<SD>,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query
> = SessionRequest extends SystemHttpRequestType ?
  SessionRequest :
  express.Request<P, ResBody, ReqBody, ReqQuery, SessionMiddlewareLocalsType>;

export type SystemResponseOrExpressResponse<
  SessionResponse,
  SD extends SessionData = UserSessionData,
  ResBody = any,
  SessionMiddlewareLocalsType extends Record<string, any> = SystemResponseLocals<SD>,
> = SessionResponse extends SystemHttpResponseType ?
  SessionResponse :
  express.Response<ResBody, SessionMiddlewareLocalsType>;
