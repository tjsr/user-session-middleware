import { addCalledHandler, verifyPrerequisiteHandler } from '../middleware/handlerChainLog.js';

import { EmailAddress } from '../types.js';
import { SessionRegenerationFailedError } from '../errors/authenticationErrorClasses.js';
import { SystemHttpRequestType } from '../types/request.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import { assert } from 'console';
import express from '../express/index.js';
import { regenerateSessionPromise } from '../sessionUser.js';
import { requestHasSessionId } from '../getSession.js';
import { retrieveUserDataForSession } from '../auth/retrieveUserDataForSession.js';

export const session: UserSessionMiddlewareRequestHandler = (
  request: SystemHttpRequestType,
  response,
  next: express.NextFunction
) => {
  console.debug(session, 'Regenerating session id:', request.sessionID, request.session.id);
  const email: EmailAddress = request.session.email;

  try {
    request.regenerateSessionId = true;
    response.locals.sendAuthenticationResult = true;

    if (!requestHasSessionId(request)) {
      // Handle requests that provide no sessionId - we can't possibly have a userId from this.
      return next();
    }
  
    regenerateSessionPromise(request.session).then(() => {
      if (email) {
        retrieveUserDataForSession(email, request.session, response.locals, next)
          .catch((err) => {
            const regenerateErr = new SessionRegenerationFailedError(err);
            console.error(session, 'Failed retrieving data for user while regenerating session', regenerateErr, err);
            return next(regenerateErr);
      
            // passAuthOrUnknownError(response.locals, err, next);
          });
      } else {
        next();
      }
    }).catch((err) => {
      const regenerateErr = new SessionRegenerationFailedError(err);
      console.error(session, 'Failed regenerating session', regenerateErr, err);
      return next(regenerateErr);

      // passAuthOrUnknownError(response.locals, err, next);
    });
  } catch (fnErr) {
    const regenerateErr = new SessionRegenerationFailedError(fnErr);
    console.error(session, 'Failed regenerating session', regenerateErr, fnErr);
    return next(regenerateErr);

    // passAuthOrUnknownError(response.locals, fnErr, next);
  }
};

export const assignUserDataToRegeneratedSession: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next: express.NextFunction
) => {
  addCalledHandler(response, assignUserDataToRegeneratedSession.name);
  verifyPrerequisiteHandler(response, session.name);

  assert(request.session.userId !== undefined, 'No userId assigned to session');
  console.debug(assignUserDataToRegeneratedSession,
    'Assigning user data to regenerated session:', response.locals.userAuthenticationData);
  Object.assign(request.session, response.locals.userAuthenticationData);
  next();
};
