import { SystemHttpRequestType, SystemSessionDataType } from "../types";
import express, { NextFunction } from "express";

import { SessionHandlerError } from "../errors";

export const sessionErrorHandler = (
  err: Error,
  req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  next: NextFunction
) => {
  if (err.name === 'SessionHandlerError') {
    const sessionError: SessionHandlerError = err as SessionHandlerError;
    res.status(sessionError.status);
    res.json({ message: sessionError.message });
    return;
  }
  console.error(err.stack);
  if (res.statusCode < 200) {
    console.trace('No status code set on response, setting to 500.');
    res.status(500);
  }
  next(err);
};
