import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler,
} from '../types/middlewareHandlerTypes.ts';

import { HttpStatusCode } from '../httpStatusCodes.ts';
import { NextFunction } from '../express/index.ts';
import { SystemHttpRequestType } from '../types/request.ts';
import { SystemHttpResponseType } from '../types/response.ts';
import { addCalledHandler } from './handlerChainLog.ts';

export const endRequest: UserSessionMiddlewareRequestHandler = (
  _req: SystemHttpRequestType,
  response: SystemHttpResponseType,
  _next: NextFunction
): void => {
  addCalledHandler(response, endRequest);
  console.debug(endRequest, 'Ending test request');
  response.send();
  response.end();
};

export const endErrorRequest: UserSessionMiddlewareErrorHandler = (
  err: Error,
  _req: SystemHttpRequestType,
  response: SystemHttpResponseType,
  _next: NextFunction
) => {
  addCalledHandler(response, endErrorRequest);
  console.warn(endErrorRequest, 'Got end error request', err, response.statusCode);
  if (response.statusCode === HttpStatusCode.OK) {
    response.status(HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
  try {
    response.sendStatus(response.statusCode);
  } catch (err) {
    console.error(endErrorRequest, 'Error in endErrorRequest when asserting prereq handlers', err);
    response.sendStatus(HttpStatusCode.NOT_IMPLEMENTED);
  }
  response.end();
};