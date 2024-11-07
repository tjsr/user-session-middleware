/* eslint-disable indent */
import * as express from '../../express/index.js';

import { addCalledHandler, assertCorequisiteHandler, assertPrerequisiteHandler } from '../handlerChainLog.js';

import { SystemHttpRequestType } from '../../types/request.js';
import { SystemHttpResponseType } from '../../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.js';
import { handleSessionDataRetrieval } from './handleSessionDataRetrieval.js';
import { saveSessionPromise } from '../../sessionUser.js';

export const handleNewSessionWithNoSessionData: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
>(
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
): void => {
  addCalledHandler(response, handleNewSessionWithNoSessionData);
  // This must be called *before* handleExistingSessionWithNoSessionData because it sets newSessionIdGenerated
  assertCorequisiteHandler(response, handleExistingSessionWithNoSessionData);
  if (request.newSessionIdGenerated !== true) {
    next();
    return;
  }

  assertPrerequisiteHandler(response, handleSessionDataRetrieval);

  if (response.locals?.retrievedSessionData) {
    // This will actually be an error state, but we'll handle it in its own handler.
    next();
    return;
  }

  const sessionConfig = request.app.locals['sessionConfig'] || undefined;
  if (!(sessionConfig?.resave || sessionConfig?.saveUninitialized)) {
    // Then save the session data to the session store.
    saveSessionPromise(request.session)
      .then(() => {
        // Finally, send us to the error handler
        // Essentially this is requireSessionDataForExistingId
        next();
      })
      .catch((err) => {
        console.error(
          handleNewSessionWithNoSessionData,
          'promiseReject',
          'Failed while saving session wrapped as promise.',
          err
        );
        next(err);
      });
  } else {
    next();
  }
};
