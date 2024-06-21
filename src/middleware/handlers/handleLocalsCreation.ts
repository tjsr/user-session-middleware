import { UserSessionMiddlewareRequestHandler } from "../../types/middlewareHandlerTypes.js";
import { addCalledHandler } from "../handlerChainLog.js";

export const LOG_HANDLERS_SETTING = 'debugCallHandlers';

export const handleLocalsCreation: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next
):void => {
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
  if (request.app.get('debugCallHandlers')) {
    response.locals.debugCallHandlers = true;
  }

  // We do this at the end for this handler, but would usually do it first for all other handlers.
  addCalledHandler(response, handleLocalsCreation.name);
  next();
};
