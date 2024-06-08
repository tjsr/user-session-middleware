import expressSession, { Session, SessionData } from "express-session";

import { ParamsDictionary } from "express-serve-static-core";
import QueryString from 'qs';
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
  userId: UserId | undefined;
  email: EmailAddress | undefined;
  newId: boolean | undefined;
}

// export interface ISystemSessionData extends SessionData {
// }

// export type SystemSessionDataType = ISystemSessionData & SessionDataFields;

export interface SystemSessionDataType extends SessionData, SessionDataFields {}

export interface UserSessionResponseLocals<StoreData extends SessionStoreDataType> {
  calledHandlers: HandlerName[];
  retrievedSessionData?: StoreData;
  skipHandlerDependencyChecks: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpRequestType<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreData extends SessionStoreDataType = SessionStoreDataType,
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = QueryString.ParsedQs,
  Locals extends Record<string, any> = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
> extends express.Request<P, ResBody, ReqBody, ReqQuery, Locals & UserSessionResponseLocals<StoreData>> {
  newSessionIdGenerated?: boolean;
  session: Session & SessionDataType;
  sessionID: SessionId;
  regenerateSessionId?: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface SystemHttpResponseType<
  StoreData extends SessionStoreDataType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResBody = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
> extends express.Response<ResBody, UserSessionResponseLocals<StoreData> | Record<string, any>> {
  // locals: {
  //   calledHandlers: HandlerName[];
  //   retrievedSessionData?: StoreData;
  //   skipHandlerDependencyChecks: boolean;
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // } | Record<string, any>
}

export interface SessionMiddlewareErrorHandler<
  SessionData extends SystemSessionDataType,
  RequestType extends SystemHttpRequestType<SessionData>,
  StoreData extends SessionStoreDataType,
  ResponseType extends SystemHttpResponseType<StoreData>
> extends express.RequestHandler {
  error: Error,
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
}

export interface SessionMiddlewareHandler<
  SessionData extends SystemSessionDataType,
  RequestType extends SystemHttpRequestType<SessionData>,
  StoreData extends SessionStoreDataType,
  ResponseType extends SystemHttpResponseType<StoreData>
> extends express.RequestHandler {
  request: RequestType,
  response: ResponseType,
  next: express.NextFunction
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

export type UserModel = {
  userId: uuid4;
  email: EmailAddress;
};
