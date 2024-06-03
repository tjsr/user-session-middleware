import { Session, SessionData } from "express-session";

import express from "express";

export type uuid = string;
export type uuid5 = uuid;
export type uuid4 = uuid;
export type SnowflakeType = bigint | string;
export type UserId = uuid5;
export type EmailAddress = string;
export type SessionId = uuid5;
export type HandlerName = string;

export interface SessionStoreDataType extends SessionDataFields {}

interface SessionDataFields {
  userId: UserId;
  email: EmailAddress;
  newId: boolean | undefined;
}

export interface SystemSessionDataType extends SessionData, SessionDataFields {
}

export interface SessionMiddlewareErrorHandler<
SessionData extends SystemSessionDataType,
RequestType extends SystemHttpRequestType<SessionData>> extends express.RequestHandler {
  err: Error,
  req: RequestType,
  res: express.Response,
  next: express.NextFunction
}

export interface SessionMiddlewareHandler<
SessionData extends SystemSessionDataType,
RequestType extends SystemHttpRequestType<SessionData>> extends express.RequestHandler {
  req: RequestType,
  res: express.Response,
  next: express.NextFunction
}

export interface SystemHttpRequestType<SessionData extends SystemSessionDataType> extends express.Request {
  newSessionIdGenerated?: boolean;
  session: Session & Partial<SessionData>;
  sessionID: SessionId;
  regenerateSessionId?: boolean;
}

export interface SystemHttpResponse<StoreData extends SessionStoreDataType> extends express.Response {
  locals: {
    calledHandlers: HandlerName[];
    retrievedSessionData?: StoreData;
    skipHandlerDependencyChecks: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } | Record<string, any>
}
