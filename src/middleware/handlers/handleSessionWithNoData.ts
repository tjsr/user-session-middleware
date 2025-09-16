import * as express from '../../express/index.ts';

import { addCalledHandler, assertCorequisiteHandler } from '../handlerChainLog.ts';

import { IdNamespace } from '../../types.ts';
import { SystemHttpRequestType } from '../../types/request.ts';
import { SystemHttpResponseType } from '../../types/response.ts';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.ts';
import { applyUserIdFromSession } from '../../auth/user.ts';
import { getAppUserIdNamespace } from '../../auth/userNamespace.ts';
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.ts';

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
