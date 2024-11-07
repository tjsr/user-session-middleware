import * as express from '../express-session/index.js';

import { EmailAddress, UserId } from "../types.js";

export interface UserSessionDataFields {
  userId: UserId;
  email: EmailAddress;
  newId: boolean | undefined;
}  

// export type SessionStoreDataTypeVariant<DataFieldsType extends UserSessionDataFields> = DataFieldsType;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SessionStoreDataType extends UserSessionDataFields {}

// export interface UserSessionData extends SessionData, SessionDataFields {
// }

export type UserSessionData = express.SessionData & UserSessionDataFields;
