import { SystemResponseLocals } from "./locals.js";
import { UserSessionData } from "./session.js";
import express from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpResponseType<
  SD extends UserSessionData = UserSessionData,
  ResBody = any,
  Locals extends SystemResponseLocals = SystemResponseLocals<SD>
> extends express.Response<ResBody, Locals> {
  locals: Locals;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
