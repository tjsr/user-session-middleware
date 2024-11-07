import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { addCalledHandler } from '../handlerChainLog.js';

export const LOG_HANDLERS_SETTING = 'debugCallHandlers';

export const handleResponseLocalsCreation: UserSessionMiddlewareRequestHandler = (request, response, next): void => {
  if (!response.locals) {
    response.locals = {
      calledHandlers: [],
      skipHandlerDependencyChecks: false,
    };
  } else {
    if (!response.locals.calledHandlers) {
      response.locals.calledHandlers = [];
    }
    if (response.locals.skipHandlerDependencyChecks === undefined) {
      response.locals.skipHandlerDependencyChecks = false;
    }
  }
  if (request.app.locals[LOG_HANDLERS_SETTING] !== undefined) {
    response.locals.debugCallHandlers = request.app.locals[LOG_HANDLERS_SETTING];
  }

  // We do this at the end for this handler, but would usually do it first for all other handlers.
  addCalledHandler(response, handleResponseLocalsCreation);
  next();
};
