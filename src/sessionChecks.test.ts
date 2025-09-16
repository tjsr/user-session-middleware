import { SessionTestContext, setupSessionContext } from './utils/testing/context/session.ts';
import { createContextForSessionTest, createTestRequestSessionData } from './testUtils.ts';

import { SessionData } from 'express-session';
import { SessionDataTestContext } from './api/utils/testcontext.ts';
import { SessionEnabledRequestContext } from './utils/testing/context/request.ts';
import { SessionNotGeneratedError } from './errors/errorClasses.ts';
import { SessionOptions } from 'express-session';
import { clearIgnoreLogFilters } from './setup-tests.ts';
import { regenerateSessionIdIfNoSessionData } from './sessionChecks.ts';
import session from 'express-session';

describe('endResponseWhenNoSessionId', () => {
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
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
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
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

  beforeEach((context: SessionDataTestContext & SessionTestContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
  });

  test<SessionEnabledRequestContext>('Should regenerate the session ID when no session data is received', async (context) => {
    const { request, response, next } = createTestRequestSessionData(
      context,
      { sessionID: 'test-session-id' },
      { noMockSave: true }
    );

    session({ store: context.sessionOptions.store } as SessionOptions)(request, response, next);
    // const reqSession: Session = memoryStore.createSession(context.request, testSessionData);

    const sessionData: SessionData | undefined = undefined;
    const result = await regenerateSessionIdIfNoSessionData(sessionData, request);
    expect(result).not.toBeUndefined();
    expect(request.sessionID).not.toBe('test-session-id');
    expect(request.sessionID).not.toBe(undefined);
    expect(request.sessionID).toBe(result);
  });

  test<SessionEnabledRequestContext>('Should throw an errow when requesting to regenerate a session that was never initiated.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      { sessionID: 'test-session-id' },
      { skipCreateSession: true }
    );

    const sessionData: SessionData | undefined = undefined;

    await expect(async () => await regenerateSessionIdIfNoSessionData(sessionData, request)).rejects.toThrowError(
      expect.any(SessionNotGeneratedError)
    );
    expect(request.regenerateSessionId).toBe(undefined);
    expect(request.newSessionIdGenerated).toBe(false);
    expect(request.sessionID).toBe('test-session-id');
  });
});
