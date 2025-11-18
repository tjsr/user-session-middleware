import { SystemHttpRequestType } from './types/request.ts';
import { SystemHttpResponseType } from './types/response.ts';
import { UserSessionData } from './types/session.ts';
import { UserSessionMiddlewareRequestHandler } from './types/middlewareHandlerTypes.ts';
import { addCalledHandler } from './middleware/handlerChainLog.ts';
import assert from 'node:assert';
import { assignUserIdToRequestSession } from './sessionUser.ts';
import express from './express/index.ts';
import { getAppUserIdNamespace } from './auth/userNamespace.ts';

const LOG_NO_COPY_USER_ID_TO_SESSION = process.env['LOG_NO_COPY_USER_ID_TO_SESSION'] === 'true';

// TODO: This works??
// This comes after setting data from the session store.
export const handleAssignUserIdToRequestSessionWhenNoExistingSessionData: UserSessionMiddlewareRequestHandler = async <
  RequestType extends SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType<UserSessionData>
>(
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleAssignUserIdToRequestSessionWhenNoExistingSessionData);

  // Use as an assertion
  try {
    const _namespace = getAppUserIdNamespace(request.app, next);
  } catch (error: unknown) {
    console.error(
      handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
      'No namespace found for userId; cannot assign userId to session.'
    );
    return next(error);
  }

  if (response.locals?.retrievedSessionData) {
    // Nothing to do here if there's already data in the session store as we'll use that ID.
    next();
    return;
  }

  if (request.session.userId) {
    if (LOG_NO_COPY_USER_ID_TO_SESSION) {
      console.debug(
        handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
        'userId already exists on session; skipping copy from to session.',
        request.session.userId
      );
    }
    return next();
  }

  try {
    const existingRequestSessionId = request.sessionID;
    assert(request.sessionID === request.session.id, 'sessionID and session.id do not match! This should never happen');
    await assignUserIdToRequestSession(request);
    const updatedRequestSessionId = request.sessionID;
    assert(
      request.sessionID === request.session.id,
      'Updated sessionID and session.id do not match! This should never happen'
    );
    const idMutation = `${existingRequestSessionId}=>${updatedRequestSessionId}`;
    console.debug(
      handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
      'Finished assigning userId for session with missing session data.',
      idMutation
    );
    next();
  } catch (err) {
    console.error(
      handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
      'Passing to error handler for assigning sessonId with missing data.',
      err
    );
    next(err);
  }
};
