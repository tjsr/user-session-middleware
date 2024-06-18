/* eslint-disable @typescript-eslint/no-explicit-any */

import * as expressSession from 'express-session';

import { EmailAddress, UserId } from "../types.js";

import { UserSessionData } from "../types/session.js";

declare module "express-session" { 
  interface SessionData {
    userId: UserId;
    email: EmailAddress;
    newId: boolean | undefined;
    hasLoggedOut: boolean;
  }
  
  // interface Session extends Partial<SessionData> {}
  interface Session extends UserSessionData {}

  // interface Session {
  //   // sessionID: string;
  //   userId: UserId | undefined;
  //   email: EmailAddress | undefined;
  //   newId: boolean | undefined;
  // }
}

export const session = expressSession;

export { Cookie, MemoryStore, Store } from 'express-session';
export type { Session, SessionData } from 'express-session';

