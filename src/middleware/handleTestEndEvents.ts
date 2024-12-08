import {
  UserSessionMiddlewareErrorHandler,
  UserSessionMiddlewareRequestHandler,
} from '../types/middlewareHandlerTypes.js';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { NextFunction } from '../express/index.js';
import { SystemHttpRequestType } from '../types/request.js';
import { SystemHttpResponseType } from '../types/response.js';
import { addCalledHandler } from './handlerChainLog.js';

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
