import { HandlerName } from "../../types.js";
import { SystemHttpResponseType } from "../../types/response.js";
import { addCalledHandler } from "../../middleware/handlerChainLog.js";

export const markHandlersCalled = (response: SystemHttpResponseType, handlers: HandlerName[], silent = false) => {
  handlers.forEach((handlerName) => {
    addCalledHandler(response, handlerName, silent);
  });
};
