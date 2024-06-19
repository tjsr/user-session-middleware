import { SystemHttpRequestType } from '../../types/request.js';
import { SystemHttpResponseType } from '../../types/response.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';
import { addCalledHandler } from "../handlerChainLog.js";
import express from '../../express/index.js';
import { requireSessionInitialized } from '../../errors/sessionErrorChecks.js';

export const handleSessionWithNewlyGeneratedId: UserSessionMiddlewareRequestHandler = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType
>(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, handleSessionWithNewlyGeneratedId.name);

  try {
    requireSessionInitialized(request.session);
  } catch (sessionErr) {
    console.error(handleSessionWithNewlyGeneratedId, 'request.session was not initialised.', sessionErr);
    next(sessionErr);
    return;
  };

  if (request.newSessionIdGenerated === true) {
    request.session.save((err) => {
      if (err) {
        console.error(handleSessionWithNewlyGeneratedId, 'Error saving session data.', err);
        next(err);
      } else {
        next();
      }
    });
  } else {
    next();
  }
};
