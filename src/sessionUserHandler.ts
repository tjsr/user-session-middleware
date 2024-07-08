import { addCalledHandler, assertPrerequisiteHandler } from "./middleware/handlerChainLog.js";
import {
  handleCopySessionStoreDataToSession,
  handleExistingSessionWithNoSessionData,
  handleNewSessionWithNoSessionData,
  handleSessionDataRetrieval
} from "./middleware/handlers/index.js";

import { SystemHttpRequestType } from "./types/request.js";
import { SystemHttpResponseType } from './types/response.js';
import { UserSessionData } from "./types/session.js";
import { UserSessionMiddlewareRequestHandler } from './types/middlewareHandlerTypes.js';
import assert from "node:assert";
import { assignUserIdToRequestSession } from "./sessionUser.js";
import express from "./express/index.js";

// TODO: This works??
// This comes after setting data from the session store.
export const handleAssignUserIdToRequestSessionWhenNoExistingSessionData: UserSessionMiddlewareRequestHandler =
async <
  RequestType extends SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType<UserSessionData>,
  >(
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleAssignUserIdToRequestSessionWhenNoExistingSessionData);
  assertPrerequisiteHandler(response, handleCopySessionStoreDataToSession);
  assertPrerequisiteHandler(response, handleNewSessionWithNoSessionData);
  assertPrerequisiteHandler(response, handleExistingSessionWithNoSessionData);
  assertPrerequisiteHandler(response, handleSessionDataRetrieval);

  if (response.locals?.retrievedSessionData) {
    // Nothing to do here if there's already data in the session store as we'll use that ID.
    // That should be handled in handleCopySessionStoreDataToSession
    next();
    return;
  }

  if (request.session.userId) {
    console.debug(handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
      'userId already exists on session; skipping copy from to session.');
    return next();
  }

  try {
    const existingRequestSessionId = request.sessionID;
    assert(request.sessionID === request.session.id, 'sessionID and session.id do not match! This should never happen');
    await assignUserIdToRequestSession(request);
    const updatedRequestSessionId = request.sessionID;
    assert(request.sessionID === request.session.id,
      'Updated sessionID and session.id do not match! This should never happen');
    const idMutation = `${existingRequestSessionId}=>${updatedRequestSessionId}`;
    console.debug(handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
      `Finished assigning userId for session ${idMutation} with missing session data.`);
    next();
  } catch (err) {
    console.error(handleAssignUserIdToRequestSessionWhenNoExistingSessionData,
      'Passing to error handler for assigning sessonId with missing data.',
      err);
    next(err);
  }
};
