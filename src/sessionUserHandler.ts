import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "./types.js";
import { addCalledHandler, verifyPrerequisiteHandler } from "./middleware/handlerChainLog.js";

import { assignUserIdToRequestSession } from "./sessionUser.js";
import express from "express";
import { handleSessionDataRetrieval } from "./middleware/storedSessionData.js";

// This comes after setting data from the session store.
export const handleAssignUserIdToRequestSessionWhenNoExistingSessionData = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends SystemHttpResponse<SessionStoreDataType>,
  >(
    request: RequestType,
    response: ResponseType,
    next: express.NextFunction
  ) => {
  addCalledHandler(response, handleAssignUserIdToRequestSessionWhenNoExistingSessionData.name);
  verifyPrerequisiteHandler(response, handleSessionDataRetrieval.name);

  try {
    assignUserIdToRequestSession(request);
    next();
  } catch (err) {
    next(err);
  }
};
