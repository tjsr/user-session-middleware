import {
  ERROR_SESSION_NOT_INITIALIZED,
  NO_SESSION_ID_FOR_NEW_REQUEST_TRUE,
  NO_SESSION_ID_IN_REQUEST,
  SESSION_ID_NOT_GENERATED,
} from "./errorCodes.js";
import { HandlerName, SessionId } from "../types.js";
import { Session, SessionData, Store } from "express-session";
import {
  SessionDataNotExpectedError,
  SessionStoreNotConfiguredError
} from "./errorClasses.js";

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
    throw new SessionDataNotExpectedError();
  }
};

// export const requireSessionDataForExistingId = (
//   newSessionIdGenerated: boolean | undefined,
//   retrievedSessionData: SessionStoreDataType | null | undefined
// ): void => {
//   if (newSessionIdGenerated !== true && !retrievedSessionData) {
//     throw new NoSessionDataFoundError();
//   }
// };

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

export const requireSessionStoreConfigured = (
  sessionStore: Store | undefined,
  handlerChain: HandlerName[]
): void => {
  if (!sessionStore) {
    throw new SessionStoreNotConfiguredError(handlerChain);
  }
};
