import * as core from 'express-serve-static-core';

import { SessionDataFields, SessionStoreDataType, SystemSessionDataType } from "./session.js";

import { Session } from "express-session";
import { SessionId } from "../types.js";
import { SystemResponseLocals } from './locals.js';
import express from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpRequestType<
  SessionDataType extends SystemSessionDataType = SystemSessionDataType,
  StoreDataType extends SessionDataFields = SessionStoreDataType,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends SystemResponseLocals<StoreDataType> = SystemResponseLocals<StoreDataType>,
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
