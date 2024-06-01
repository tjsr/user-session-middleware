import { HandlerName, SessionStoreDataType, SystemHttpResponse } from "../types.js";
import { MiddlewareCallOrderError, RequiredMiddlewareNotCalledError } from "../errors/errorClasses.js";

export const addCalledHandler = (
  response: SystemHttpResponse<SessionStoreDataType>,
  handlerName: HandlerName
): void => {
  if (response.locals.calledHandlers === undefined) {
    response.locals.calledHandlers = [];
  }
  response.locals.calledHandlers.push(handlerName);
};

export const verifyPrerequisiteHandler = (
  response: SystemHttpResponse<SessionStoreDataType>,
  handlerName: HandlerName
): void => {
  if (response.locals.calledHandlers) {
    if (!response.locals.calledHandlers.includes(handlerName)) {
      const lastHandler = response.locals.calledHandlers[response.locals.calledHandlers.length - 1];
      throw new RequiredMiddlewareNotCalledError(handlerName, lastHandler);
    }
  }
};

export const verifyCorequisiteHandler = (
  response: SystemHttpResponse<SessionStoreDataType>,
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
