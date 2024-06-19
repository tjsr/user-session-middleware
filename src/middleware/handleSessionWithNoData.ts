import * as express from '../express/index.js';

import { addCalledHandler, verifyCorequisiteHandler, verifyPrerequisiteHandler } from "./handlerChainLog.js";

import { SystemHttpRequestType } from "../types/request.js";
import { SystemHttpResponseType } from '../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import { handleExistingSessionWithNoSessionData } from './handlers/handleExistingSessionWithNoSessionData.js';
import { handleSessionDataRetrieval } from "./handlers/handleSessionDataRetrieval.js";
import { saveSessionPromise } from "../sessionUser.js";

export const handleNewSessionWithNoSessionData: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
  >(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ): void => {
  addCalledHandler(response, handleNewSessionWithNoSessionData.name);
  // This must be called *before* handleExistingSessionWithNoSessionData because it sets newSessionIdGenerated
  verifyCorequisiteHandler(response, handleExistingSessionWithNoSessionData.name);
  if (request.newSessionIdGenerated !== true) {
    console.debug(handleNewSessionWithNoSessionData, 'Skipping because using provided sessionID.');
    next();
    return;
  }

  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);

  if (response.locals?.retrievedSessionData) {
    console.debug(handleNewSessionWithNoSessionData, 'Skipping because sessionData was retrieved.');
    // This will actually be an error state, but we'll handle it in its own handler.
    next();
    return;
  }

  // Then save the session data to the session store.
  saveSessionPromise(request.session).then(() => {
    // Finally, send us to the error handler
    // Essentially this is requireSessionDataForExistingId
    next();
  }).catch((err) => {
    console.error(handleNewSessionWithNoSessionData, 'promiseReject',
      'Failed while saving session wrapped as promise.', err);
    next(err);
  });
  // await saveSessionPromise(request.session);
};

