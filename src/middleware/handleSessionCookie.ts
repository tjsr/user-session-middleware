/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from 'express-serve-static-core';

import {
  CustomLocalsOrRecord,
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler
} from "../types/middlewareHandlerTypes.js";
import { SessionStoreDataType, SystemSessionDataType } from '../types/session.js';

import { SessionIDNotGeneratedError } from '../errors/errorClasses.js';
import { SystemHttpRequestType } from '../types/request.js';
import { SystemHttpResponseType } from '../types/response.js';
import { SystemResponseLocals } from '../types/locals.js';
import { addCalledHandler } from "./handlerChainLog.js";
import express from "express";
import { setSessionCookie } from './setSessionCookie.js';

export const handleSessionCookie: UserSessionMiddlewareRequestHandler =
<
  SessionType extends SystemSessionDataType,
  StoreType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends SystemResponseLocals<StoreType> = SystemResponseLocals<StoreType>,
  RequestType extends
    SystemHttpRequestType<SessionType, StoreType, P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<SessionType, StoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<StoreType, ResBody, Locals> =
    SystemHttpResponseType<StoreType, ResBody, Locals>
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
export const handleSessionCookieOnError: UserSessionMiddlewareErrorHandler =
<
  SessionType extends SystemSessionDataType,
  StoreType extends SessionStoreDataType,
  P extends core.ParamsDictionary = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery extends core.Query = core.Query,
  Locals extends CustomLocalsOrRecord<SystemResponseLocals<StoreType>> = 
    CustomLocalsOrRecord<SystemResponseLocals<StoreType>>,
  RequestType extends express.Request<P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<SessionType, StoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
    //  =
    // SystemHttpRequestType<SessionType, StoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends express.Response<ResBody, Locals> =
    SystemHttpResponseType<StoreType, ResBody, Locals>,
  // |
    //  =
    // SystemHttpResponseType<StoreType, ResBody, Locals>
>(
    error: Error,
    request: SystemHttpRequestType | RequestType,
    response: SystemHttpResponseType | ResponseType,
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
