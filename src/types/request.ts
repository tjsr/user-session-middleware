import * as core from 'express-serve-static-core';
import * as express from "../express/index.js";

import { SessionId } from "../types.js";
import { SystemResponseLocals } from './locals.js';
import { UserSessionData } from "./session.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpRequestType<
  SD extends UserSessionData = UserSessionData,
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends SystemResponseLocals = SystemResponseLocals<SD>,
  >
extends express.Request<
  P,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals
> {
  newSessionIdGenerated?: boolean;
  // session: express.Session & Partial<SessionDataType>;
  sessionID: SessionId;
  regenerateSessionId?: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
