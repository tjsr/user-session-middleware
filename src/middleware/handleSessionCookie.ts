/* eslint-disable @typescript-eslint/no-explicit-any */
import * as core from 'express-serve-static-core';

import {
  CustomLocalsOrRecord,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.js";
import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemResponseLocals,
  SystemSessionDataType,
} from "../types.js";

import { SessionIDNotGeneratedError } from '../errors/errorClasses.js';
import { addCalledHandler } from "./handlerChainLog.js";
import express from "express";
import { setSessionCookie } from './setSessionCookie.js';

export const handleSessionCookie: UserSessionMiddlewareRequestHandler =
<
  ApplicationSessionType extends SystemSessionDataType,
  ApplicationStoreType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends CustomLocalsOrRecord<SystemResponseLocals<ApplicationStoreType>> = 
    CustomLocalsOrRecord<SystemResponseLocals<ApplicationStoreType>>,
  RequestType extends
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<ApplicationStoreType, ResBody, Locals> =
    SystemHttpResponseType<ApplicationStoreType, ResBody, Locals>
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, handleSessionCookie.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookie, 'Got to handleSessionCookie with undefined request.sessionID');
    const err = new SessionIDNotGeneratedError();
    next(err);
    return;
  }
  setSessionCookie(request as SystemHttpRequestType, response);
  request.session.save((err) => {
    if (err) {
      console.error(handleSessionCookie, 'Error saving session in handleSessionCookie', err);
      next(err);
      return;
    }
    console.log(handleSessionCookie, `Saved session ${request.sessionID} set in cookie handler.`);
    next();
  });
};

// TODO: Fix type param compatibility.
export const handleSessionCookieOnError = // : UserSessionMiddlewareErrorHandler =
<
  ApplicationSessionType extends SystemSessionDataType,
  ApplicationStoreType extends SessionStoreDataType,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends CustomLocalsOrRecord<SystemResponseLocals<ApplicationStoreType>> = 
    CustomLocalsOrRecord<SystemResponseLocals<ApplicationStoreType>>,
  RequestType extends
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals> |
    express.Request<P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<ApplicationStoreType, ResBody, Locals> |
    express.Response<ResBody, Locals> =
    SystemHttpResponseType<ApplicationStoreType, ResBody, Locals>
>(
    error: Error,
    request: RequestType,
    response: ResponseType,
    nextErrorHandler: express.NextFunction
  ):void => {
  addCalledHandler(response, handleSessionCookieOnError.name);
  if (request.sessionID === undefined) {
    console.error(handleSessionCookieOnError,
      'No sessionID on request when setting cookie in cookie error handler.  Something is wrong here.');
  } else {
    // TODO: Remove need to cast here.
    setSessionCookie(request as express.Request, response);
  }
  request.session.save((saveErr) => {
    if (saveErr) {
      console.error(handleSessionCookieOnError, 'Error saving session in handleSessionCookie', saveErr);
      nextErrorHandler(saveErr);
      return;
    }
    console.log(handleSessionCookieOnError, `Saved session ${request.sessionID} set in error handler.`);
    nextErrorHandler(error);
  });
};
