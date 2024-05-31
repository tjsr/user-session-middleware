import { SessionStoreDataType, SystemSessionDataType } from '../types.js';
import session, { Session, SessionData } from "express-session";

import { saveSessionPromise } from '../sessionUser.js';

export const saveSessionDataToSession = async <ApplicationDataType extends SessionStoreDataType>(
  storedSessionData: SessionStoreDataType,
  session: Session & Partial<ApplicationDataType>
): Promise<void> => {
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

  return saveSessionPromise(session);
};

export const retrieveSessionDataFromStore = <ApplicationDataType extends SystemSessionDataType>(
  sessionStore: session.Store,
  sessionID: string
): Promise<ApplicationDataType | null | undefined> => {
  if (sessionID === undefined) {
    return Promise.reject(new Error('No session ID received'));
  }
  return new Promise<ApplicationDataType>((resolve, reject) => {
    sessionStore.get(
      sessionID,
      async (err: Error, genericSessionData: SessionData | null | undefined) => {
        if (err) {
          reject(err);
        }
        resolve(genericSessionData as ApplicationDataType);
      });
  });
};
