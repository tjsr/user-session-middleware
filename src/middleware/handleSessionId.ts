/* eslint-disable @typescript-eslint/no-explicit-any */

import * as core from 'express-serve-static-core';

import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemResponseLocals,
  SystemSessionDataType,
} from "../types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";
import express, { NextFunction } from "express";
import {
  handleExistingSessionWithNoSessionData,
  handleNewSessionWithNoSessionData
} from './handleSessionWithNoData.js';
import {
  requireSessionIdGenerated,
  requireSessionIdWhenNewSessionIdGenerated,
  requireSessionInitialized,
} from '../errors/sessionErrorChecks.js';

import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';

export const handleSessionIdRequired: UserSessionMiddlewareRequestHandler = 
<
  ApplicationSessionType extends SystemSessionDataType,
  ApplicationStoreType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> | SystemResponseLocals<ApplicationStoreType> =
    Record<string, any> | SystemResponseLocals<ApplicationStoreType>,
  RequestType extends
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<ApplicationSessionType, ApplicationStoreType, P, ResBody, ReqBody, ReqQuery, Locals>,
  ResponseType extends SystemHttpResponseType<ApplicationStoreType, ResBody, Locals> =
    SystemHttpResponseType<ApplicationStoreType, ResBody, Locals>
>(
    request: RequestType,
    response: ResponseType,
    handleSessionWithNewlyGeneratedId: NextFunction
  ): void => {
  addCalledHandler(response, handleSessionIdRequired.name);
  try {
    requireSessionIdGenerated(request.sessionID);
  } catch (sessionError) {
    handleSessionWithNewlyGeneratedId(sessionError);
    return;
  }
  handleSessionWithNewlyGeneratedId();
};

export const handleSessionWithNewlyGeneratedId: UserSessionMiddlewareRequestHandler =
<
RequestType extends SystemHttpRequestType<SystemSessionDataType>,
ResponseType extends SystemHttpResponseType<SessionStoreDataType>
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, handleSessionWithNewlyGeneratedId.name);

  try {
    requireSessionInitialized(request.session);
  } catch (sessionErr) {
    console.error(handleSessionWithNewlyGeneratedId, 'request.session was not initialised.', sessionErr);
    next(sessionErr);
    return;
  };

  if (request.newSessionIdGenerated === true) {
    request.session.save((err) => {
      if (err) {
        console.error(handleSessionWithNewlyGeneratedId, 'Error saving session data.', err);
        next(err);
      } else {
        next();
      }
    });
  } else {
    next();
  }
};

export const checkNewlyGeneratedId = (
  request: SystemHttpRequestType,
  next: express.NextFunction // handleRetrievedSessionDataOrErrorHandler
): boolean => {
  try {
    requireSessionIdWhenNewSessionIdGenerated(request.sessionID, request.newSessionIdGenerated);
  } catch (sessionErr) {
    next(sessionErr);
    return true;
  }
  if (request.newSessionIdGenerated) {
    next();
    return true;
  }
  return false;
};

export const handleSessionIdAfterDataRetrieval: UserSessionMiddlewareRequestHandler =
<
  ApplicationSessionType extends SystemSessionDataType,
  ApplicationStoreType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> | SystemResponseLocals<ApplicationStoreType> =
    Record<string, any> | SystemResponseLocals<ApplicationStoreType>,
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
  addCalledHandler(response, handleSessionIdAfterDataRetrieval.name);
  verifyPrerequisiteHandler(response, handleNewSessionWithNoSessionData.name);
  verifyPrerequisiteHandler(response, handleExistingSessionWithNoSessionData.name);

  try {
    requireSessionIdGenerated(request.sessionID);
    next();
  } catch (err) {
    next(err);
  }
};
