import {
  ERROR_SESSION_NOT_INITIALIZED,
  NEW_SESSION_ID_DATA_EXISTS,
  NO_SESSION_DATA_FROM_STORE,
  NO_SESSION_ID_FOR_NEW_REQUEST_TRUE,
  NO_SESSION_ID_IN_REQUEST,
  SESSION_ID_NOT_GENERATED,
} from "./errorCodes.js";
import { Session, SessionData } from "express-session";
import { SessionId, SessionStoreDataType } from "../types.js";

import { SessionHandlerError } from "./SessionHandlerError.js";

export const requireSessionIdGenerated = (
  sessionID: string|undefined
): void => {
  if (!sessionID) {
    // This should never get called.
    throw new SessionHandlerError(
      SESSION_ID_NOT_GENERATED, 500, 'No session ID received - can\'t process retrieved session.');
  }
  return;
};

export const requireSessionIdInRequest = (
  sessionID: string|undefined
): void => {
  if (!sessionID) {
    // This should never get called.
    throw new SessionHandlerError(NO_SESSION_ID_IN_REQUEST);
  }
  return;
};

export const requireNoSessionDataForNewlyGeneratedId = (
  newSessionIdGenerated: boolean | undefined,
  retrievedSessionData: SessionData | null | undefined
): void => {
  if (newSessionIdGenerated === true && retrievedSessionData) {
    throw new SessionHandlerError(NEW_SESSION_ID_DATA_EXISTS);
  }
};

export const requireSessionDataForExistingId = (
  retrievedSessionData: SessionStoreDataType | null | undefined
): void => {
  if (!retrievedSessionData) {
    throw new SessionHandlerError(NO_SESSION_DATA_FROM_STORE, 401,
      'SessionID received but no session data, with no new id generated.');
  }
};

export const requireSessionIdWhenNewSessionIdGenerated = (
  sessionId: SessionId | undefined,
  newSessionIdGenerated: boolean | undefined
): void => {
  if (sessionId === undefined && newSessionIdGenerated === true) {
    throw new SessionHandlerError(NO_SESSION_ID_FOR_NEW_REQUEST_TRUE);
  }
};

export const requireSessionInitialized = (
  session: Session | undefined
): void => {
  if (!session) {
    throw new SessionHandlerError(ERROR_SESSION_NOT_INITIALIZED);
  }
};

