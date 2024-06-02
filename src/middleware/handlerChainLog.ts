import { HandlerName, SessionStoreDataType, SystemHttpResponse } from "../types.js";
import { MiddlewareCallOrderError, RequiredMiddlewareNotCalledError } from "../errors/errorClasses.js";

export const addCalledHandler = <ResponseType extends SystemHttpResponse<SessionStoreDataType>>(
  response: ResponseType,
  handlerName: HandlerName,
  silentCallHandlers = false
): void => {
  if (silentCallHandlers) {
    console.debug(addCalledHandler, 'Handler called', handlerName);
  }
  if (response.locals.calledHandlers === undefined) {
    response.locals.calledHandlers = [];
  }
  response.locals.calledHandlers.push(handlerName);
};

export const verifyPrerequisiteHandler = <ResponseType extends SystemHttpResponse<SessionStoreDataType>>(
  response: ResponseType,
  handlerName: HandlerName
): void => {
  if (response.locals.calledHandlers) {
    if (!response.locals.calledHandlers.includes(handlerName)) {
      const lastHandler = response.locals.calledHandlers[response.locals.calledHandlers.length - 1];
      const err = new RequiredMiddlewareNotCalledError(handlerName, lastHandler);
      console.error(verifyPrerequisiteHandler, err.message);
      throw err;
    }
  }
};

export const verifyCorequisiteHandler = <ResponseType extends SystemHttpResponse<SessionStoreDataType>>(
  response: ResponseType,
  handlerName: HandlerName
): void => {
  if (response.locals.calledHandlers) {
    if (response.locals.calledHandlers.includes(handlerName)) {
      const lastHandler = response.locals.calledHandlers[response.locals.calledHandlers.length - 1];
      throw new MiddlewareCallOrderError(
        `Corequisite handler ${handlerName} already called before ${lastHandler}.`);
    }
  }
};
