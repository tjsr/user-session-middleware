import { Session, SessionData } from "express-session";

import express from "express";

export type uuid = string;
export type uuid5 = uuid;
export type uuid4 = uuid;
export type SnowflakeType = bigint | string;
export type UserId = uuid5;
export type EmailAddress = string;

export interface SystemSessionDataType extends SessionData {
  userId: UserId;
  email: EmailAddress;
  newId: boolean | undefined;
}

export interface SystemHttpRequestType<Data extends SystemSessionDataType> extends express.Request {
  session: Session & Partial<Data>;
  newSessionIdGenerated?: boolean;
}
