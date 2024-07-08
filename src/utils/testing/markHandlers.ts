import { ErrorRequestHandler, Handler } from "../../express/index.js";

import { SystemHttpResponseType } from "../../types/response.js";
import { addCalledHandler } from "../../middleware/handlerChainLog.js";

export const markHandlersCalled = (response: SystemHttpResponseType,
  handlers: (Handler|ErrorRequestHandler)[], silent = false) => {
  handlers.forEach((handler) => {
    addCalledHandler(response, handler, silent);
  });
};
