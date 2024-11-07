import { SystemResponseLocals } from "./locals.js";
import { UserSessionData } from "./session.js";
import express from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpResponseType<
  SD extends UserSessionData = UserSessionData,
  ResBody = any,
  ResponseLocals extends SystemResponseLocals = SystemResponseLocals<SD>,
> extends express.Response<ResBody, ResponseLocals> {
  locals: ResponseLocals;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
