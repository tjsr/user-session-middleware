import * as express from '../../express/index.js';

import { addCalledHandler, assertCorequisiteHandler } from '../handlerChainLog.js';

import { IdNamespace } from '../../types.js';
import { SystemHttpRequestType } from '../../types/request.js';
import { SystemHttpResponseType } from '../../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { applyUserIdFromSession } from '../../auth/user.js';
import { getAppUserIdNamespace } from '../../auth/userNamespace.js';
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.js';

// prettier-ignore
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
    console.debug(handleNewSessionWithNoSessionData, 'Skipping because using provided sessionID.');
    next();
    return;
  }

  if (response.locals?.retrievedSessionData) {
    console.debug(handleNewSessionWithNoSessionData, 'Skipping because sessionData was retrieved.');
    // This will actually be an error state, but we'll handle it in its own handler.
    next();
    return;
  }

  try {
    const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);
    applyUserIdFromSession(userIdNamespace, request.session);
    next();
  } catch (err) {
    console.error(handleNewSessionWithNoSessionData, 'Failed touching session.', err);
    next(err);
    return;
  }
};

