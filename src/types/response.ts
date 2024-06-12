import { SessionStoreDataType } from "./session.js";
import { SystemResponseLocals } from "./locals.js";
import express from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SystemHttpResponseType<
  StoreDataType extends SessionStoreDataType = SessionStoreDataType,
  ResBody = any,
  Locals extends SystemResponseLocals<StoreDataType> = SystemResponseLocals<StoreDataType>
> extends express.Response<ResBody, Locals> {
  locals: Locals;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
