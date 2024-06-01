import { SessionId, SystemHttpRequestType, SystemSessionDataType } from './types.js';

import { SessionData } from "express-session";
import { applyNewIdToSession } from './getSession.js';

export const regenerateSessionIdIfNoSessionData = (
  retrievedSessionData: SessionData | null | undefined,
  request: SystemHttpRequestType<SystemSessionDataType>
): SessionId | undefined => {
  if (!retrievedSessionData) {
    const newSessionId = applyNewIdToSession(request, true);
    console.debug(regenerateSessionIdIfNoSessionData,
      `SessionID received for ${request.sessionID} but no session data, generating a new sessionId ${newSessionId}.`);
    return newSessionId;
  }
  return undefined;
};
