import { IdNamespace } from '../../types.js';
import { SystemHttpRequestType } from '../../types/request.js';
import { SystemHttpResponseType } from '../../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { addCalledHandler } from '../handlerChainLog.js';
import { applyUserIdFromSession } from '../../auth/user.js';
import express from '../../express/index.js';
import { getAppUserIdNamespace } from '../../auth/userNamespace.js';
import { requireSessionInitialized } from '../../errors/sessionErrorChecks.js';

// prettier-ignore
export const handleSessionWithNewlyGeneratedId: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, handleSessionWithNewlyGeneratedId);

  try {
    requireSessionInitialized(request.session);
  } catch (sessionErr) {
    console.error(handleSessionWithNewlyGeneratedId, 'request.session was not initialised.', sessionErr);
    next(sessionErr);
    return;
  }

  try {
    const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);
    applyUserIdFromSession(userIdNamespace, request.session);
    next();
  } catch (err) {
    console.error(handleSessionWithNewlyGeneratedId, 'Failed touching session.', err);
    next(err);
    return;
  }
};
