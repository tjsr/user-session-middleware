import { ErrorRequestHandler, Handler } from "../express/index.js";
import { MiddlewareCallOrderError, RequiredMiddlewareNotCalledError } from "../errors/errorClasses.js";

import { SystemHttpResponseType } from '../types/response.js';
import assert from "node:assert";
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

export const addCalledHandler = (
  response: SystemHttpResponseType,
  handler: Handler|ErrorRequestHandler,
  silentCallHandlers = false
): void => {
  if (silentCallHandlers || response.locals?.debugCallHandlers === true) {
    console.debug(addCalledHandler, 'Handler called', handler);
  }
  if (response.locals.calledHandlers === undefined) {
    response.locals.calledHandlers = [];
  }
  assert(typeof handler !== 'string');
  response.locals.calledHandlers.push(handler);
};

export const assertPrerequisiteHandler = <ResponseType extends SystemHttpResponseType>(
  response: ResponseType,
  handler: Handler|ErrorRequestHandler
): void => {
  if (handlerAssertionsEnabled() && response.locals?.calledHandlers) {
    if (!response.locals?.calledHandlers?.includes(handler)) {
      const lastHandler = response.locals?.calledHandlers[response.locals.calledHandlers.length - 1];
      assert (lastHandler !== undefined, 'calledHandlers stack had no elements!  This should never happen!');
      const err = new RequiredMiddlewareNotCalledError(handler, lastHandler);
      console.trace(assertPrerequisiteHandler, err.message);
      throw err;
    }
  }
};

export const assertCorequisiteHandler = <ResponseType extends SystemHttpResponseType>(
  response: ResponseType,
  handlerName: Handler|ErrorRequestHandler
): void => {
  if (handlerAssertionsEnabled() && response.locals.calledHandlers) {
    if (response.locals.calledHandlers.includes(handlerName)) {
      const lastHandler = response.locals.calledHandlers[response.locals.calledHandlers.length - 1];
      throw new MiddlewareCallOrderError(
        `Corequisite handler ${handlerName} already called before ${lastHandler}.`);
    }
  }
};
