import * as expressSession from 'express-session';

import { EmailAddress, UserId } from '../types.ts';

import { UserSessionData } from '../types/session.ts';

declare module 'express-session' {
  interface SessionData {
    email: EmailAddress;
    hasLoggedOut: boolean;
    newId: boolean | undefined;
    userId: UserId;
  }

  // interface Session extends Partial<SessionData> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Session extends UserSessionData {}

  // interface Session {
  //   // sessionID: string;
  //   userId: UserId | undefined;
  //   email: EmailAddress | undefined;
  //   newId: boolean | undefined;
  // }
}

export const session = expressSession;

export { Cookie, CookieOptions, MemoryStore, Store, SessionOptions } from 'express-session';
export type { Session, SessionData } from 'express-session';

export default session;
