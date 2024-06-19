/* eslint-disable @typescript-eslint/no-explicit-any */

import { SystemHttpRequestType } from '../types/request.js';
import express from "express";
import {
  requireSessionIdWhenNewSessionIdGenerated,
} from '../errors/sessionErrorChecks.js';

export const checkNewlyGeneratedId = (
  request: SystemHttpRequestType,
  next: express.NextFunction // handleRetrievedSessionDataOrErrorHandler
): boolean => {
  try {
    requireSessionIdWhenNewSessionIdGenerated(request.sessionID, request.newSessionIdGenerated);
  } catch (sessionErr) {
    next(sessionErr);
    return true;
  }
  if (request.newSessionIdGenerated) {
    next();
    return true;
  }
  return false;
};

