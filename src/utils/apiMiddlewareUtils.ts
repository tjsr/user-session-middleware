import { SessionStoreDataType, SystemHttpRequestType, SystemSessionDataType, UserId } from '../types.js';
import express, { NextFunction } from 'express';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { getUserIdFromSession } from '../auth/user.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const endWithJsonMessage = async <ResponseType extends express.Response<JSON, any>>(
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

export const validateHasUserId = async <
  SessionDataType extends SystemSessionDataType,
  StoreDataType extends SessionStoreDataType,
  RequestType extends SystemHttpRequestType<SessionDataType, StoreDataType>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResponseType extends express.Response<JSON, any>,
>(
  request: RequestType,
  response: ResponseType,
  next: NextFunction
): Promise<void> => {
  let userId: UserId | undefined = undefined;
  try {
    userId = await getUserIdFromSession(request.session);
  } catch (error) {
    console.warn('Got an exception when getting userId data', error);
    return endWithJsonMessage(response, HttpStatusCode.INTERNAL_SERVER_ERROR, 'Invalid user', next);
  }
  if (userId === undefined) {
    return endWithJsonMessage(response, HttpStatusCode.UNAUTHORIZED, 'Invalid user', next);
  }
  console.debug(validateHasUserId, 'Got valid userId', userId);
  next();
  return;
};
