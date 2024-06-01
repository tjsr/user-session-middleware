import { SystemHttpRequestType, SystemSessionDataType } from "../types";
import express, { NextFunction } from "express";

import { SessionHandlerError } from "../errors/SessionHandlerError.js";

export const sessionErrorHandler = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
    err: Error,
    req: RequestType,
    res: express.Response,
    next: express.NextFunction
  ) => {
  if (err.name === 'SessionHandlerError') {
    const sessionError: SessionHandlerError = err as SessionHandlerError;
    res.status(sessionError.status);
    res.json({ message: sessionError.message });
    next(err);
    return;
  }
  if (res.statusCode <= 200) {
    console.error(err, 'Error with res.statusCode < 200 - this test should fail.');
    res.status(500);
  }
  next(err);
};

export const endRequest = (
  _req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  _next: NextFunction
) => {
  res.send();
  res.end();
};

export const endErrorRequest = (
  err: Error,
  _req: SystemHttpRequestType<SystemSessionDataType>,
  res: express.Response,
  _next: NextFunction
) => {
  console.warn(endErrorRequest, 'Got end error request', res.statusCode, res.status);
  res.send(res.statusCode);
  res.end();
};
