import * as express from '../../express/index.ts';

import { IdNamespace } from '../../types.ts';
import { SystemHttpRequestType } from '../../types/request.ts';
import { SystemHttpResponseType } from '../../types/response.ts';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.ts';
import { addCalledHandler } from '../handlerChainLog.ts';
import { applyUserIdFromSession } from '../../auth/user.ts';
import { getAppUserIdNamespace } from '../../auth/userNamespace.ts';

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
