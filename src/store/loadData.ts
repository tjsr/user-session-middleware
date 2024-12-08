import { SessionStoreDataType, UserSessionData } from "../types/session.js";
import session, { Session, SessionData } from "express-session";

export const copySessionDataToSession = (storedSessionData: SessionStoreDataType, session: Session): void => {
  session.newId = undefined;
  if (storedSessionData?.userId && session.userId == undefined) {
    session.userId = storedSessionData.userId;
  }
  if (storedSessionData?.email && session.email == undefined) {
    session.email = storedSessionData.email;
  }
  if (storedSessionData?.newId !== undefined && session.newId == undefined) {
    // Should only ever be new the first time we write a userId received from another auth source.
    session.newId = false;
  }
};

export const retrieveSessionDataFromStore = <ApplicationSessionType extends UserSessionData>(
  sessionStore: session.Store,
  sessionID: string
): Promise<ApplicationSessionType | null | undefined> => {
  if (sessionID === undefined) {
    return Promise.reject(new Error('No session ID received'));
  }
  return new Promise<ApplicationSessionType>((resolve, reject) => {
    sessionStore.get(
      sessionID,
      async (err: Error, genericSessionData: SessionData | null | undefined) => {
        if (err) {
          reject(err);
        }
        resolve(genericSessionData as ApplicationSessionType);
      });
  });
};
