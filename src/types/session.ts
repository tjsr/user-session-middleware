import * as express from '../express-session/index.ts';

import { EmailAddress, UserId } from '../types.js';

export interface UserSessionDataFields {
  email: EmailAddress;
  newId: boolean | undefined;
  userId: UserId;
}

// export type SessionStoreDataTypeVariant<DataFieldsType extends UserSessionDataFields> = DataFieldsType;

export interface SessionStoreDataType extends UserSessionDataFields {}

// export interface UserSessionData extends SessionData, SessionDataFields {
// }

export type UserSessionData = express.SessionData & UserSessionDataFields;
