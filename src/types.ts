import expressSession, { Session, SessionData } from "express-session";

import express from "express";

export type uuid = string;
export type uuid5 = uuid;
export type uuid4 = uuid;
export type SnowflakeType = bigint | string;
export type EmailAddress = string;
export type HandlerName = string;
export type IdNamespace = uuid5;
export type IPAddress = string;
export type UserId = uuid5;
export type SessionId = uuid5;

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

export interface SystemHttpRequestType<
  SessionData extends SystemSessionDataType = SystemSessionDataType>
extends express.Request {
  newSessionIdGenerated?: boolean;
  session: Session & SessionData;
  sessionID: SessionId;
  regenerateSessionId?: boolean;
}

export interface SystemHttpResponseType<StoreData extends SessionStoreDataType> extends express.Response {
  locals: {
    calledHandlers: HandlerName[];
    retrievedSessionData?: StoreData;
    skipHandlerDependencyChecks: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } | Record<string, any>
}

export interface UserSessionOptions extends expressSession.SessionOptions {
  // Return a 401 if the session id is not recognized in store
  rejectUnrecognizedSessionId?: boolean | undefined;

  // Check and throw an error if a middleware call that's expected didn't occur
  validateMiddlewareDependencies?: boolean | undefined;

  // Don't set * as the Access-Control-Allow-Origin header
  skipExposeHeaders?: boolean | undefined;

  // Look for the session id in the X-Session-Id header
  useForwardedSessions?: boolean | undefined;
}
