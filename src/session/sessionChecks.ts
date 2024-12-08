import {
  RequestSessionIdRequiredError,
  SessionDataNotFoundError,
  SessionIDValueMismatch,
  SessionIdRequiredError,
  SessionIdTypeError
} from '../errors/errorClasses.js';

import { Session } from '../express-session/index.js';

export const requireSessionIsIsString = (session: Session) => {
  if (typeof session.id !== 'string') {
    throw new SessionIdTypeError(
      `Session ID defined on session is not a uuid (${typeof session.id}) when assigning userId.`
    );
  }
};
export const requireSessionId = (session: Session) => {
  if (!session.id) {
    throw new SessionIdRequiredError('Session ID is not defined on session when assigning userId to session.');
  }
};
export const requireRequestSessionId = (sessionID: string | undefined) => {
  if (!sessionID) {
    throw new RequestSessionIdRequiredError('Request sessionID is not defined when assigning userId to session.');
  }
};
export const requireSessionInitialized = (session: Session) => {
  if (!session) {
    throw new SessionDataNotFoundError('Session is not defined when assigning userId to session.');
  }
};
export const requireSessionIDValuesMatch = (sessionID: string, sessionIDFromSession: string) => {
  if (sessionID !== sessionIDFromSession) {
    throw new SessionIDValueMismatch(sessionID, sessionIDFromSession);
  }
};
