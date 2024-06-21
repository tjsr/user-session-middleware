import { addCalledHandler, verifyPrerequisiteHandler } from "../handlerChainLog.js";

import { AuthenticationRestResult } from "../../types/apiResults.js";
import { Session } from "../../express-session/index.js";
import { SystemHttpResponseType } from "../../types/response.js";
import { UserSessionData } from "../../types/session.js";
import { UserSessionMiddlewareRequestHandler } from "../../types/middlewareHandlerTypes.js";
import { handleLocalsCreation } from "./handleLocalsCreation.js";

export const sendAuthResultBody = (session: UserSessionData & Session, response: SystemHttpResponseType) => {
  const result: AuthenticationRestResult = {
    email: session.email,
    isLoggedIn: session.email !== undefined,
    sessionId: session.id,
  };
  console.debug(sendAuthResultBody, 'Sending body to client, no further headers allowed.');
  response.send(result);
  response.end();
  return;
};

export const handleSessionUserBodyResults: UserSessionMiddlewareRequestHandler = (request, response, next) => {
  addCalledHandler(response, handleSessionUserBodyResults.name);
  verifyPrerequisiteHandler(response, handleLocalsCreation.name);
  if (response.locals.sendAuthenticationResult) {
    sendAuthResultBody(request.session, response);
  }
  if (request.body) {
    console.log(handleSessionUserBodyResults, request.body);
  }
  next();
};
