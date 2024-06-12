import { EmailAddress, UserId } from "../types.js";

import { SessionData } from "express-session";

export type SessionStoreDataTypeVariant<DataFieldsType extends SessionDataFields> = DataFieldsType;

export interface SessionStoreDataType extends SessionDataFields {}

export interface SessionDataFields {
  userId: UserId;
  email: EmailAddress;
  newId: boolean | undefined;
}

export interface SystemSessionDataType extends SessionData, SessionDataFields {
}
