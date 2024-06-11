/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType,
  UserId,
} from '../types.js';
import express, { NextFunction } from 'express';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { Session } from 'express-session';
import {
  UserSessionMiddlewareRequestHandler
} from '../types/middlewareHandlerTypes.js';
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

export const validateHasUserId: UserSessionMiddlewareRequestHandler = (
// <
//   SessionDataType extends SystemSessionDataType,
//   ProvidedRequestType = SystemHttpRequestType<SessionDataType>,
//   StoreDataType extends SessionStoreDataType,
//   P extends core.ParamsDictionary = core.ParamsDictionary,
//   ResBody = any,
//   ReqBody = any,
//   ReqQuery extends QueryString.ParsedQs = QueryString.ParsedQs,
//   Locals extends CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>> = 
//     CustomLocalsOrRecord<SystemResponseLocals<StoreDataType>>,
//   RequestType extends SystemRequestOrExpressRequest<ProvidedRequestType> = // <SessionDataType, StoreDataType, any, Locals, P, ResBody, ReqBody, ReqQuery> =
//     SystemRequestOrExpressRequest<any, StoreDataType, Locals, P, ResBody, ReqBody, ReqQuery>,
//   ResponseType extends SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals> =
//     SystemResponseOrExpressResponse<StoreDataType, RequestType, ResBody, Locals>
// >(
//     request: RequestType,
//     response: ResponseType,
  request: SystemHttpRequestType,
  response: SystemHttpResponseType,
  next: NextFunction
): void => {
  try {
    // TODO: Fix casting here.
    getUserIdFromSession(request.session as (Session & SystemSessionDataType)).then((userId: UserId|undefined) => {
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
