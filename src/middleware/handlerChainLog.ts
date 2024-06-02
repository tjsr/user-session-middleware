import { HandlerName, SessionStoreDataType, SystemHttpResponse } from "../types.js";
import { MiddlewareCallOrderError, RequiredMiddlewareNotCalledError } from "../errors/errorClasses.js";

import { isTestMode } from "@tjsr/simple-env-utils";

const HANDLER_ASSERTIONS_ENABLED = process.env['HANDLER_ASSERTIONS_ENABLED'] === 'true' ? true : false;

let FORCE_HANDLER_ASSERTIONS = false;
let DISABLE_HANDLER_ASSERTIONS = false;

export const forceHandlerAssertions = (force = true): void => {
  FORCE_HANDLER_ASSERTIONS = force;
};

export const disableHandlerAssertions = (disabled = false): void => {
  DISABLE_HANDLER_ASSERTIONS = disabled;
};

const handlerAssertionsEnabled = (): boolean => {
  if (FORCE_HANDLER_ASSERTIONS) {
    return true;
  }
  if (DISABLE_HANDLER_ASSERTIONS) {
    return false;
  }
  return !isTestMode() && process.env['HANDLER_ASSERTIONS_ENABLED'] === 'true' ? true : HANDLER_ASSERTIONS_ENABLED;
};

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
  if (handlerAssertionsEnabled() && response.locals.calledHandlers) {
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
  if (handlerAssertionsEnabled() && response.locals.calledHandlers) {
    if (response.locals.calledHandlers.includes(handlerName)) {
      const lastHandler = response.locals.calledHandlers[response.locals.calledHandlers.length - 1];
      throw new MiddlewareCallOrderError(
        `Corequisite handler ${handlerName} already called before ${lastHandler}.`);
    }
  }
};
