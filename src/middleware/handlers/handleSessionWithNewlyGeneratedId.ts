import { IdNamespace } from '../../types.ts';
import { SystemHttpRequestType } from '../../types/request.ts';
import { SystemHttpResponseType } from '../../types/response.ts';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.ts';
import { addCalledHandler } from '../handlerChainLog.ts';
import { applyUserIdFromSession } from '../../auth/user.ts';
import express from '../../express/index.ts';
import { getAppUserIdNamespace } from '../../auth/userNamespace.ts';
import { requireSessionInitialized } from '../../errors/sessionErrorChecks.ts';

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
