/* eslint-disable @typescript-eslint/no-explicit-any */

import { SystemHttpRequestType } from '../types/request.js';
import { SystemResponseLocals } from '../types/locals.js';
import { UserSessionData } from '../types/session.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import express from 'express';

export const testRequestHandler: UserSessionMiddlewareRequestHandler = (
  _request: express.Request,
  _response,
  next: express.NextFunction
): void => {
  next();
};

describe('Verify types for middleware are valid.', () => {
  test('Should be able to assign RequestHandler', () => {
    const trh: UserSessionMiddlewareRequestHandler = {} as UserSessionMiddlewareRequestHandler;
    const reqHandlerType: express.RequestHandler = testRequestHandler;
    const reqHandler2: express.RequestHandler = trh;
    expect(reqHandlerType).toBeDefined();
    expect(reqHandler2).toBeDefined();
  });

  test('Should be able to assign Request', () => {
    const sessionReq: SystemHttpRequestType<UserSessionData> = {
    } as SystemHttpRequestType;

    const req: express.Request = sessionReq;
    expect(req).toBeDefined();
  });

  test('Should be able to assign SystemResponseLocals<Type> to Record<string, any>', () => {
    // Intended to prevent TS2322
    // Type 'Response<any, Record<string, any>, number> | undefined' is not assignable to
    // type 'Response<any, SystemResponseLocals<UserSessionData>, number> | undefined'.
    const recordLocals: Record<string, any> = { user: { id: '1234' } };
    let recordLocalsCheck: Record<string, any> = recordLocals;
    expect(recordLocals).toBeDefined();

    const sysResponseLocals: SystemResponseLocals<UserSessionData> = {
      calledHandlers: ['someHandler'],
      retrievedSessionData: undefined,
      skipHandlerDependencyChecks: false,
      user: { id: '1234' },
    };
    expect(sysResponseLocals).toBeDefined();
    recordLocalsCheck = sysResponseLocals;
    expect(recordLocalsCheck).toBeDefined();
  });


});
