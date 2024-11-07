import { addCalledHandler, assertPrerequisiteHandler } from "../handlerChainLog.js";

import { AuthenticationRestResult } from "../../types/apiResults.js";
import { Session } from "../../express-session/index.js";
import { SystemHttpResponseType } from "../../types/response.js";
import { UserSessionData } from "../../types/session.js";
import { UserSessionMiddlewareRequestHandler } from "../../types/middlewareHandlerTypes.js";
import { handleResponseLocalsCreation } from './handleResponseLocalsCreation.js';

const DEBUG_LOG_USER_BODY = false;

export const sendAuthResultBody = (
  session: UserSessionData & Session,
  response: SystemHttpResponseType
): AuthenticationRestResult => {
  const result: AuthenticationRestResult = {
    email: session.email,
    isLoggedIn: session.email !== undefined,
    sessionId: session.id,
  };
  console.debug(sendAuthResultBody, 'Sending body to client, no further headers allowed.');
  response.send(result);
  response.end();
  return result;
};

export const handleSessionUserBodyResults: UserSessionMiddlewareRequestHandler = (request, response, next) => {
  addCalledHandler(response, handleSessionUserBodyResults);
  assertPrerequisiteHandler(response, handleResponseLocalsCreation);
  if (response.locals.sendAuthenticationResult) {
    const result = sendAuthResultBody(request.session, response);
    if (DEBUG_LOG_USER_BODY && result) {
      console.debug(handleSessionUserBodyResults, result);
    }
  }
  next();
};
