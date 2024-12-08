import * as express from '../../express/index.js';

import { IdNamespace } from '../../types.js';
import { SystemHttpRequestType } from '../../types/request.js';
import { SystemHttpResponseType } from '../../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { addCalledHandler } from '../handlerChainLog.js';
import { applyUserIdFromSession } from '../../auth/user.js';
import { getAppUserIdNamespace } from '../../auth/userNamespace.js';

// prettier-ignore
export const handleExistingSessionWithNoSessionData: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ): void => {
  addCalledHandler(response, handleExistingSessionWithNoSessionData);
  if (request.newSessionIdGenerated === true) {
    next();
    return;
  }

  if (response.locals?.retrievedSessionData) {
    next();
    return;
  }

  try {
    const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);
    applyUserIdFromSession(userIdNamespace, request.session);
    next();
  } catch (err) {
    console.error(handleExistingSessionWithNoSessionData, 'Failed touching session.', err);
    next(err);
    return;
  }
};
