/* eslint-disable @typescript-eslint/no-explicit-any */

import * as QueryString from 'qs';
import * as core from 'express-serve-static-core';

import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType,
  UserId,
} from '../types.js';
import express, { NextFunction } from 'express';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import { getUserIdFromSession } from '../auth/user.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const endWithJsonMessage = async <ResponseType extends express.Response<JSON|any, any>>(
  res: ResponseType,
  status: number | HttpStatusCode,
  message: string,
  next?: NextFunction,
  additionalMessageFields: object = {}
): Promise<void> => {
  res.status(status);
  res.contentType('application/json');
  const outputBody = {
    ...additionalMessageFields,
    message,
  } as object as JSON;
  res.send(outputBody);
  const error = new Error(`${status}/${message}`);
  return new Promise((resolve) => {
    if (next) {
      next(error);
    } else {
      res.end();
    }
    return resolve();
  });
};

export const validateHasUserId: UserSessionMiddlewareRequestHandler = <
  SessionDataType extends SystemSessionDataType,
  StoreDataType extends SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = QueryString.ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
  // | SystemResponseLocals<StoreDataType> = Record<string, any> | SystemResponseLocals<StoreDataType> =
  // Record<string, any> | SystemResponseLocals<StoreDataType>
  RequestType extends SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals> =
    SystemHttpRequestType<SessionDataType, StoreDataType, P, ResBody, ReqBody, ReqQuery, Locals>,
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResponseType extends SystemHttpResponseType<StoreDataType, ResBody, Locals> =
    SystemHttpResponseType<StoreDataType, ResBody, Locals>,
  // // extends express.Response,// <JSON, any>,
>(
    request: RequestType,
    response: ResponseType,
    next: NextFunction
  ): void => {
  try {
    getUserIdFromSession(request.session).then((userId: UserId|undefined) => {
      if (userId === undefined) {
        return endWithJsonMessage(response, HttpStatusCode.UNAUTHORIZED, 'Invalid user', next);
      }
      console.debug(validateHasUserId, 'Got valid userId', userId);
      return next();
    }).catch((error: Error) => {
      return next(error);
    });
  } catch (error) {
    console.warn('Got an exception when getting userId data', error);
    endWithJsonMessage(response, HttpStatusCode.INTERNAL_SERVER_ERROR, 'Invalid user', next);
  }
  return;
};
