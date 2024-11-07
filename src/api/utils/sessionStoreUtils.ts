import { SessionId } from "../../types.js";
import { Store } from "../../express-session/index.js";
import { UserSessionData } from "../../types/session.js";

export const getStoreSessionAsPromise = (store: Store, sessionId: SessionId): Promise<UserSessionData> =>
  new Promise<UserSessionData>((resolve, reject) => {
    store.get(sessionId, (err: Error, session) => {
      if (err) {
        reject(err);
      } else {
        if (!session) {
          reject(new Error(`No session found for ${sessionId}`));
        }
        resolve(session as UserSessionData);
      }
    });
  });
