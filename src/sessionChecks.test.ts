import * as Express from "express";

import { Cookie, SessionData } from "express-session";
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  endResponseIfNoSessionData,
  endResponseOnError,
  endResponseWhenNewIdGeneratedButSessionDataAlreadyExists,
  endResponseWhenNoSessionId
} from './sessionChecks.js';
import { getMockReq, getMockRes } from 'vitest-mock-express';

import { addIgnoredLog } from "./setup-tests.js";

describe('endResponseOnError', () => {
  let tmpStdErr: typeof console.error;

  beforeEach(() => {
    tmpStdErr = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = tmpStdErr;
  });

  test ('Should end the response when any error is received', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    addIgnoredLog('Error getting session data');
    const result = endResponseOnError(new Error('Test error'), res);
    expect(result).toBe(true);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.end).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(new Error('Test error'));
  });

  test('Should return false when no error is received', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const result = endResponseOnError(undefined, getMockRes<Express.Response>().res);
    expect(result).toBe(false);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});

describe('endResponseWhenNoSessionId', () => {
  test('Should end the response when no sessionID is received', () => {
    const { res, next: _next } = getMockRes<Express.Response>();
    addIgnoredLog('No session ID received - can\'t process retrieved session.');

    const req = getMockReq<Express.Request>({
      sessionID: undefined,
    });

    const result = endResponseWhenNoSessionId(req, res);
    expect(result).toBe(true);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.end).toHaveBeenCalled();
  });

  test('Should return false when a sessionID is received', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      sessionID: 'test-session-id',
    });

    const result = endResponseWhenNoSessionId(req, res);
    expect(result).toBe(false);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });
});

describe('endResponseWhenNewIdGeneratedButSessionDataAlreadyExists', () => {
  test('Should end the response when a new sessionID is generated but session data already exists', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: true,
      sessionID: 'test-session-id',
    });

    const sessionData: SessionData = {
      cookie: new Cookie(),
    };

    addIgnoredLog('SessionID received for test-session-id but new id generated');

    const result = endResponseWhenNewIdGeneratedButSessionDataAlreadyExists(req, res, sessionData);
    expect(result).toBe(true);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.end).toHaveBeenCalled();
  });

  test('Should return false when a new sessionID is generated and no session data exists', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: true,
      sessionID: 'test-session-id',
    });

    const result = endResponseWhenNewIdGeneratedButSessionDataAlreadyExists(req, res, undefined);
    expect(result).toBe(false);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });

  test ('Should return false when a new sessionID is not generated', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      newSessionIdGenerated: false,
      sessionID: 'test-session-id',
    });

    const sessionData: SessionData = {
      cookie: new Cookie(),
    };

    const result = endResponseWhenNewIdGeneratedButSessionDataAlreadyExists(req, res, sessionData);
    expect(result).toBe(false);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });
});

describe('endResponseIfNoSessionData', () => {
  test('Should end the response when no session data is received', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      sessionID: 'test-session-id',
    });

    addIgnoredLog('SessionID received for test-session-id but no session data');

    const sessionData: SessionData|undefined = undefined;
    const result = endResponseIfNoSessionData(sessionData, req, res);
    expect(result).toBe(true);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.end).toHaveBeenCalled();
  });

  test ('Should return false when session data is received', () => {
    const { res, next: _next } = getMockRes<Express.Response>();

    const req = getMockReq<Express.Request>({
      sessionID: 'test-session-id',
    });

    const sessionData: SessionData = {
      cookie: new Cookie(),
    };
    const result = endResponseIfNoSessionData(sessionData, req, res);
    expect(result).toBe(false);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });
});
