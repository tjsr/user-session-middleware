import {
  RegeneratedSessionIdIncorrectError,
  RegeneratingSessionIdError,
  SessionNotGeneratedError
} from './errors/errorClasses.js';

import { Barrier } from './asyncUtils.js';
import { SessionData } from "express-session";
import { SessionId } from './types.js';
import { SystemHttpRequestType } from './types/request.js';
import { UserSessionData } from './types/session.js';

export const regenerateSessionIdIfNoSessionData = async (
  retrievedSessionData: SessionData | null | undefined,
  request: SystemHttpRequestType<UserSessionData>
): Promise<SessionId | undefined> => {
  const currentSessionId = request.sessionID;

  if (!retrievedSessionData) {
    const oldSessionId = request.session?.id;
    if (request.session) {
      request.regenerateSessionId = true;
      request.newSessionIdGenerated = true;

      const barrier = new Barrier<SessionId>();
      try {
        console.log(regenerateSessionIdIfNoSessionData, 'Regenerating session...', request.session.id);
        request.session.regenerate((err) => {
          if (err) {
            const regenerationError = new RegeneratingSessionIdError(err);
            barrier.reject(regenerationError);
            return;
          }
          if (request.sessionID === oldSessionId || request.sessionID !== request.session?.id) {
            // Hopefully this does not occur.
            const unreassinedIdError = new RegeneratedSessionIdIncorrectError();
            barrier.reject(unreassinedIdError);
            return;
          }
          console.debug(
            regenerateSessionIdIfNoSessionData,
            `SessionID received for ${currentSessionId} but no session data`,
            `Regenerated sessionId as ${request.session.id}.`
          );
          barrier.release(request.session?.id);
        });
      } catch (err) {
        console.error(regenerateSessionIdIfNoSessionData, 'Error regenerating session', err);
        return Promise.reject(err);
      }
      return barrier.wait();
    } else {
      return Promise.reject(new SessionNotGeneratedError());
    }

    return Promise.resolve(request.session.id);
  }
  return Promise.resolve(undefined);
};
