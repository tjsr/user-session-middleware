import { SystemHttpRequestType, SystemSessionDataType } from "./types.js";

import { assignUserIdToRequestSession } from "./sessionUser.js";
import express from "express";

export const assignUserIdToRequestSessionHandler = (
  req: SystemHttpRequestType<SystemSessionDataType>,
  _res: express.Response,
  next: express.NextFunction
) => {
  assignUserIdToRequestSession(req, next);
};
