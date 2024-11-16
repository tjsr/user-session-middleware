import { EmailAddress, IdNamespace } from '../types.js';
import { SESSION_ID_COOKIE, requestHasSessionId } from '../getSession.js';
import { addCalledHandler, assertPrerequisiteHandler } from '../middleware/handlerChainLog.js';

import { SessionRegenerationFailedError } from '../errors/authenticationErrorClasses.js';
import { SystemHttpRequestType } from '../types/request.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import { assert } from 'console';
import express from '../express/index.js';
import { getAppUserIdNamespace } from '../auth/userNamespace.js';
import { regenerateSessionPromise } from '../sessionUser.js';
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

    if (!requestHasSessionId(request, SESSION_ID_COOKIE)) {
      // Handle requests that provide no sessionId - we can't possibly have a userId from this.
      return next();
    }

    regenerateSessionPromise(request.session)
      .then(() => {
        if (!email) {
          response.locals.sendAuthenticationResult = true;
          next();
        } else {
          const userIdNamespace: IdNamespace = getAppUserIdNamespace(request.app);
          retrieveUserDataForSession(userIdNamespace, email, request.session, response.locals, next).catch((err) => {
            const regenerateErr = new SessionRegenerationFailedError(err);
            console.error(session, 'Failed retrieving data for user while regenerating session', regenerateErr, err);
            return next(regenerateErr);
          });
        }
      })
      .catch((err) => {
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
  addCalledHandler(response, assignUserDataToRegeneratedSession);
  assertPrerequisiteHandler(response, session);

  assert(request.session.userId !== undefined, 'No userId assigned to session');
  console.debug(assignUserDataToRegeneratedSession,
    'Assigning user data to regenerated session:', response.locals.userAuthenticationData);
  Object.assign(request.session, response.locals.userAuthenticationData);
  next();
};
