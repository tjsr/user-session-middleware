import * as QueryString from 'qs';

import expressSession, { Session, SessionData } from "express-session";

import { ParamsDictionary } from "express-serve-static-core";
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
SessionDataType extends SystemSessionDataType,
RequestType extends SystemHttpRequestType<SessionDataType>> extends express.RequestHandler {
  err: Error,
  req: RequestType,
  res: express.Response,
  next: express.NextFunction
}

export interface SessionMiddlewareHandler<
SessionDataType extends SystemSessionDataType,
RequestType extends SystemHttpRequestType<SessionDataType>> extends express.RequestHandler {
  req: RequestType,
  res: express.Response,
  next: express.NextFunction
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpRequestType<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionStoreDataType = SessionStoreDataType,
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = QueryString.ParsedQs,
  Locals extends Record<string, any> | SystemResponseLocals<StoreDataType> =
    Record<string, any> | SystemResponseLocals<StoreDataType>
  >
extends express.Request<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals
> {
  newSessionIdGenerated?: boolean;
  session: Session & SessionDataType;
  sessionID: SessionId;
  regenerateSessionId?: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SystemResponseLocals<StoreData extends SessionStoreDataType> extends Record<string, any> {
  calledHandlers: HandlerName[];
  retrievedSessionData?: StoreData;
  skipHandlerDependencyChecks: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpResponseType<
  StoreDataType extends SessionStoreDataType,
  ResBody = any,
  Locals extends Record<string, any> | SystemResponseLocals<StoreDataType> =
    Record<string, any> | SystemResponseLocals<StoreDataType>
> extends express.Response<ResBody, Locals> {
  locals: Locals;
}
/* eslint-enable @typescript-eslint/no-explicit-any */


// {
//   calledHandlers: HandlerName[];
//   retrievedSessionData?: StoreData;
//   skipHandlerDependencyChecks: boolean;
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// } | Record<string, any>

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
