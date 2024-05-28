import * as Express from "express";

import { addIgnoredLog, clearIgnoreLogFilters } from "./setup-tests.js";
import { afterEach, describe, expect, test } from 'vitest';
import { getMockReq, getMockRes } from 'vitest-mock-express';

import { SessionData } from "express-session";
import {
  regenerateSessionIdIfNoSessionData
} from './sessionChecks.js';

describe('endResponseWhenNoSessionId', () => {
  // test('Should end the response when no sessionID is received', () => {
  //   const { res, next: _next } = getMockRes<Express.Response>();
  //   addIgnoredLog('No session ID received - can\'t process retrieved session.');

  //   const req = getMockReq<Express.Request>({
  //     sessionID: undefined,
  //   });

  //   const result = endResponseWhenNoSessionId(req, res);
  //   expect(result).toBe(true);

  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.end).toHaveBeenCalled();
  // });

  // test('Should return false when a sessionID is received', () => {
  //   const { res, next: _next } = getMockRes<Express.Response>();

  //   const req = getMockReq<Express.Request>({
  //     sessionID: 'test-session-id',
  //   });

  //   const result = endResponseWhenNoSessionId(req, res);
  //   expect(result).toBe(false);

  //   expect(res.status).not.toHaveBeenCalled();
  //   expect(res.end).not.toHaveBeenCalled();
  // });
});

describe('endResponseWhenNewIdGeneratedButSessionDataAlreadyExists', () => {
  // test('Should end the response when a new sessionID is generated but session data already exists', () => {
  //   const { res, next: _next } = getMockRes<Express.Response>();

  //   const req = getMockReq<Express.Request>({
  //     newSessionIdGenerated: true,
  //     sessionID: 'test-session-id',
  //   });

  //   const sessionData: SessionData = {
  //     cookie: new Cookie(),
  //   };

  //   // addIgnoredLogsFromFunction(errorToNextIfNoSessionData);
  //   // addIgnoredLog(/New session ID generated but session data already exists - this should never happen./i);
  //   // addIgnoredLog('SessionID received for test-session-id but new id generated');

  //   const result = endResponseWhenNewIdGeneratedButSessionDataAlreadyExists(req, res, sessionData);
  //   expect(result).toBe(true);

  //   expect(res.status).toHaveBeenCalledWith(401);
  //   expect(res.end).toHaveBeenCalled();
  // });

  // test('Should return false when a new sessionID is generated and no session data exists', () => {
  //   const { res, next: _next } = getMockRes<Express.Response>();

  //   const req = getMockReq<Express.Request>({
  //     newSessionIdGenerated: true,
  //     sessionID: 'test-session-id',
  //   });

  //   const result = endResponseWhenNewIdGeneratedButSessionDataAlreadyExists(req, res, undefined);
  //   expect(result).toBe(false);

  //   expect(res.status).not.toHaveBeenCalled();
  //   expect(res.end).not.toHaveBeenCalled();
  // });

  // test ('Should return false when a new sessionID is not generated', () => {
  //   const { res, next: _next } = getMockRes<Express.Response>();

  //   const req = getMockReq<Express.Request>({
  //     newSessionIdGenerated: false,
  //     sessionID: 'test-session-id',
  //   });

  //   const sessionData: SessionData = {
  //     cookie: new Cookie(),
  //   };

  //   const result = endResponseWhenNewIdGeneratedButSessionDataAlreadyExists(req, res, sessionData);
  //   expect(result).toBe(false);

  //   expect(res.status).not.toHaveBeenCalled();
  //   expect(res.end).not.toHaveBeenCalled();
  // });
});

describe('regenerateSessionIdIfNoSessionData', () => {
  afterEach(() => {
    clearIgnoreLogFilters();
  });

  test('Should regenerate the session ID when no session data is received', async () => {
    const { next: next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      sessionID: 'test-session-id',
    });

    addIgnoredLog(/SessionID received for test-session-id but no session data/i);

    const sessionData: SessionData|undefined = undefined;
    const result = regenerateSessionIdIfNoSessionData(sessionData, req);
    expect(result).not.toBeUndefined();
    expect(req.sessionID).not.toBe('test-session-id');
    expect(req.sessionID).not.toBe(undefined);
    expect(req.sessionID).toBe(result);

    expect(next).not.toHaveBeenCalled();
  });
});

describe('errorToNextIfNoSessionData', () => {
  // test('Should end the response when no session data is received', () => {
  //   const { res, next: next } = getMockRes<Express.Response>();

  //   const req = getMockReq<Express.Request>({
  //     sessionID: 'test-session-id',
  //   });

  //   addIgnoredLog('SessionID received for test-session-id but no session data');

  //   const sessionData: SessionData|undefined = undefined;
  //   const result = errorToNextIfNoSessionData(sessionData, req, next);
  //   expect(result).toBe(true);

  //   expect(res.status).toHaveBeenCalledWith(401);
  //   expect(res.end).not.toHaveBeenCalled();
  //   expect(next).toHaveBeenCalledWith(expect.any(Error));
  // });

  // test ('Should return false when session data is received', () => {
  //   const { res, next: next } = getMockRes<Express.Response>();

  //   const req = getMockReq<Express.Request>({
  //     sessionID: 'test-session-id',
  //   });

  //   const sessionData: SessionData = {
  //     cookie: new Cookie(),
  //   };
  //   const statusBefore = res.statusCode;
  //   const result = errorToNextIfNoSessionData(sessionData, req, next);
  //   expect(result).toBe(false);
  //   expect(req.statusCode).toEqual(statusBefore);

  //   expect(res.status).not.toHaveBeenCalled();
  //   expect(res.end).not.toHaveBeenCalled();
  //   expect(next).not.toHaveBeenCalled();
  // });
});
