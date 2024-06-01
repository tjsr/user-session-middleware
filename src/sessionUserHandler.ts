import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "./types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./middleware/handlerChainLog.js";
import {
  handleCopySessionStoreDataToSession,
  handleExistingSessionWithNoSessionData,
  handleNewSessionWithNoSessionData,
  handleSessionDataRetrieval,
} from "./middleware/storedSessionData.js";

import { assignUserIdToRequestSession } from "./sessionUser.js";
import express from "express";

// This comes after setting data from the session store.
export const handleAssignUserIdToRequestSessionWhenNoExistingSessionData = async <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends SystemHttpResponse<SessionStoreDataType>,
  >(
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
) => {
  addCalledHandler(response, handleAssignUserIdToRequestSessionWhenNoExistingSessionData.name);
  verifyPrerequisiteHandler(response, handleCopySessionStoreDataToSession.name);
  verifyPrerequisiteHandler(response, handleNewSessionWithNoSessionData.name);
  verifyPrerequisiteHandler(response, handleExistingSessionWithNoSessionData.name);
  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);

  if (response.locals?.retrievedSessionData) {
    // Nothing to do here if there's already data in the session store as we'll use that ID.
    // That should be handled in handleCopySessionStoreDataToSession
    next();
    return;
  }

  try {
    const existingRequestSessionId = request.sessionID;
    const existingSessionId = request.session.id;
    const existingMutation = `${existingRequestSessionId}/${existingSessionId}`;
    await assignUserIdToRequestSession(request);
    const updatedRequestSessionId = request.sessionID;
    const updatedSessionId = request.session.id;
    const updatedMutation = `${updatedRequestSessionId}/${updatedSessionId}`;
    const idMutation = `${existingMutation}=>${updatedMutation}`;
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
