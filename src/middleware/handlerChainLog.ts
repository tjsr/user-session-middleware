import { HandlerName, SessionStoreDataType, SystemHttpResponse } from "../types.js";
import { PREREQUISITE_HANDLER_NOT_CALLED, SessionHandlerError } from "../errors.js";

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
      throw new SessionHandlerError(PREREQUISITE_HANDLER_NOT_CALLED, 500,
        `Prerequisite handler ${handlerName} not called.`);
    }
  }
};
