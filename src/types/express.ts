/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmailAddress, UserId } from "../types.js";

import { UserSessionData } from "./session.js";

declare module "express-session" { 
  interface SessionData {
    userId: UserId;
    email: EmailAddress;
    newId: boolean | undefined;
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

export type { Session, SessionData } from 'express-session';

