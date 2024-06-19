import { addCalledHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { AuthenticationRestResult } from "../types/apiResults.js";
import { UserSessionMiddlewareRequestHandler } from "../types/middlewareHandlerTypes.js";
import { handleLocalsCreation } from "./handleLocalsCreation.js";

export const handleSessionUserBodyResults: UserSessionMiddlewareRequestHandler = (request, response, next) => {
  addCalledHandler(response, handleSessionUserBodyResults.name);
  verifyPrerequisiteHandler(response, handleLocalsCreation.name);
  if (response.locals.sendAuthenticationResult) {
    const result: AuthenticationRestResult = {
      email: request.session.email,
      isLoggedIn: request.session.email !== undefined,
    };
    console.debug(handleSessionUserBodyResults, 'Sending body to client, no further headers allowed.');
    response.send(result);
  }
  if (request.body) {
    console.log('handleSessionUserBodyResults', request.body);
  }
  next();
};