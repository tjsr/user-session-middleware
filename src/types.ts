/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Session } from "express-session";
import {
  SessionDataFields,
} from "./types/session.js";
import { SystemResponseLocals } from "./types/locals.js";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any

// declare module "@tjsr/user-session-middleware" {
declare module "express" {
  interface Request {
    session: Session & Partial<SessionDataFields>;
  }

  interface Response {
    locals: {
      calledHandlers: HandlerName[];
      retrievedSessionData: SessionDataFields | undefined;
      skipHandlerDependencyChecks: boolean;
    } & Record<string, any> & SystemResponseLocals<SessionDataFields>;
  } 
}
