import * as express from '../types/express.js';

import { EmailAddress, UserId } from "../types.js";

export interface UserSessionDataFields {
  userId: UserId;
  email: EmailAddress;
  newId: boolean | undefined;
}  

// export type SessionStoreDataTypeVariant<DataFieldsType extends UserSessionDataFields> = DataFieldsType;

export interface SessionStoreDataType extends UserSessionDataFields {}

// export interface UserSessionData extends SessionData, SessionDataFields {
// }

export type UserSessionData = express.SessionData & UserSessionDataFields;
