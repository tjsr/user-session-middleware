import { SystemResponseLocals } from '../../types/locals.ts';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.ts';
import { addCalledHandler } from '../handlerChainLog.ts';

export const LOG_HANDLERS_SETTING = 'debugCallHandlers';

const updateResponseLocals = (
  locals: SystemResponseLocals,
  newLocals: Partial<SystemResponseLocals> | undefined
): void => {
  locals.calledHandlers = locals.calledHandlers ?? newLocals?.calledHandlers ?? [];
  if (locals.skipHandlerDependencyChecks === undefined) {
    locals.skipHandlerDependencyChecks =
      newLocals?.skipHandlerDependencyChecks !== undefined ? newLocals.skipHandlerDependencyChecks : false;
  }
  if (locals.debugCallHandlers !== undefined) {
    locals.debugCallHandlers = newLocals?.debugCallHandlers !== undefined ? newLocals.debugCallHandlers : false;
  }
};

export const createResponseLocals = (
  locals: SystemResponseLocals,
  options?: SystemResponseLocals
): SystemResponseLocals => {
  if (!locals) {
    locals = {
      calledHandlers: [],
      skipHandlerDependencyChecks: false,
    };
  }
  updateResponseLocals(locals, options);
  return locals;
};

export const handleResponseLocalsCreation: UserSessionMiddlewareRequestHandler = (request, response, next): void => {
  let debug: (typeof request)['app']['locals'] | undefined = undefined;
  if (request.app.get('debugCallHandlers')) {
    debug = {
      debugCallHandlers: true,
    };
  }

  response.locals = createResponseLocals(response.locals, debug);

  // We do this at the end for this handler, but would usually do it first for all other handlers.
  addCalledHandler(response, handleResponseLocalsCreation);
  next();
};
