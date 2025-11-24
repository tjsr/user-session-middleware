import {
  SESSION_ID_COOKIE,
  defaultExpressSessionCookieOptions,
  defaultExpressSessionOptions,
  getSessionIdFromCookie,
  sessionIdFromRequest,
} from './getSession.ts';
import { SessionDataTestContext, UserAppTestContext } from './api/utils/testcontext.ts';
import { SessionEnabledRequestContext, setupRequestContext } from './utils/testing/context/request.ts';
import { SessionTestContext, setupSessionContext } from './utils/testing/context/session.ts';
import { checkForDefault, checkForOverride, getMockRequest } from './testUtils.ts';
import express, { Application } from './express/index.ts';
import expressSession, { MemoryStore } from 'express-session';

import { SystemHttpRequestType } from './types/request.ts';
import { TestContext } from 'vitest';
import { setupExpressContext } from './utils/testing/context/appLocals.ts';
import { validate } from 'uuid';

type RequestAppLocals = SystemHttpRequestType['app']['locals'];

const verifyAppOnRequest = (request: express.Request): Application => {
  request.app = request.app ?? {
    locals: {},
  };

  request.app.locals = request.app.locals ?? {};

  return request.app;
};

export const addAppLocalsToRequest = (request: SystemHttpRequestType, locals?: RequestAppLocals): RequestAppLocals => {
  request.app = verifyAppOnRequest(request);
  Object.assign(request.app.locals, locals);
  return request.app.locals;
};

describe('expressSessionConfig', () => {
  type ExpressSessionTestContextOptions = TestContext & {
    options: expressSession.SessionOptions;
  };

  const defaultOptions: expressSession.SessionOptions = defaultExpressSessionOptions();

  beforeEach((context: ExpressSessionTestContextOptions) => {
    context.options = {
      resave: true,
      rolling: true,
      saveUninitialized: false,
      secret: 'overridden-secret',
      store: new MemoryStore(),
    } as expressSession.SessionOptions;
  });

  test('Should take default value for each property', (context: ExpressSessionTestContextOptions) => {
    ['resave', 'rolling', 'saveUninitialized', 'secret', 'store'].forEach((key: string) => {
      checkForDefault(defaultOptions, context.options, key, defaultExpressSessionOptions);
    });
  });

  test('Should take default value', (context: ExpressSessionTestContextOptions) => {
    ['resave', 'rolling', 'saveUninitialized', 'secret'].forEach((key: string) => {
      checkForOverride(defaultOptions, context.options, key, defaultExpressSessionOptions);
    });
  });
});

describe('expressSessionCookie', () => {
  type ExpressSessionCookieTestContextOptions = TestContext & {
    cookie: expressSession.CookieOptions;
  };
  const defaultCookie: expressSession.CookieOptions = defaultExpressSessionCookieOptions();

  beforeEach((context: ExpressSessionCookieTestContextOptions) => {
    context.cookie = {
      maxAge: 1000 * 60 * 60 * 12, // 12 hours
      path: '/path',
      sameSite: true,
      secure: true,
    } as expressSession.CookieOptions;
  });

  test('Should take default value for each property', (context: ExpressSessionCookieTestContextOptions) => {
    ['maxAge', 'path', 'sameSite', 'secure'].forEach((key: string) => {
      checkForDefault(defaultCookie, context.cookie, key, defaultExpressSessionCookieOptions);
    });
  });

  test('Should take default resave value', (context: ExpressSessionCookieTestContextOptions) => {
    ['maxAge', 'path', 'sameSite', 'secure'].forEach((key: string) => {
      checkForOverride(defaultCookie, context.cookie, key, defaultExpressSessionCookieOptions);
    });
  });
});

describe<SessionDataTestContext>('sessionIdFromRequest.regenerateSessionId=true', () => {
  beforeEach((context: SessionDataTestContext & SessionEnabledRequestContext) => {
    setupSessionContext(context);
    setupExpressContext(context);
    context.testRequestData = {
      app: context.app,
      headers: {},
      regenerateSessionId: true,
    };
  });

  test('Should not return session.id value.', (context: SessionEnabledRequestContext) => {
    setupSessionContext(context);

    const reqContext = setupRequestContext(context, context.testRequestData);
    const sessionId = sessionIdFromRequest(reqContext.request);
    expect(sessionId).not.toEqual('test-session-id');
    expect(sessionId).not.toBeUndefined();
    expect(validate(sessionId)).toBe(true);
  });

  test<SessionEnabledRequestContext>('Should not return cookie value.', (context) => {
    context.testRequestData['session'] = {
      id: generateSessionIdForTest(context),
    };
    context.testRequestData.cookies = {
      sessionId: 'cookie-session-id',
    };

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toEqual('cookie-session-id');
    expect(sessionId).not.toBeUndefined();
    expect(validate(sessionId)).toBe(true);
  });
});

describe<SessionDataTestContext>('sessionIdFromRequest.regenerateSessionId=false', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext) => {
    const sessionContext: SessionTestContext = setupSessionContext(context);
    const appContext: UserAppTestContext = setupExpressContext(sessionContext);
    setupRequestContext(appContext);
    context.testRequestData = {
      app: appContext.app,
      headers: {},
      regenerateSessionId: false,
    };
  });

  test('Should return session.id.', (context: SessionDataTestContext & SessionTestContext & TestContext) => {
    setupSessionContext(context);
    const generatedSessionId = context.testRequestData['sessionId'];
    context.sessionOptions.name = 'test.connect.sid';
    context.testRequestData['session'] = {
      id: generatedSessionId,
    };

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual(generatedSessionId);
  });
});

describe<SessionDataTestContext>('integration.sessionIdFromRequest', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext & UserAppTestContext) => {
    setupSessionContext(context, {
      name: 'test.connect.sid',
    });
    setupExpressContext(context);
    context.testRequestData = {
      app: context.app,
      headers: {},
      regenerateSessionId: false,
    };
  });

  test<SessionEnabledRequestContext>('Should use id from session on request', (context) => {
    context.testRequestData.cookies = {
      sessionId: 'cookie-session-id',
      'test.connect.sid': 'connectCookie-session-id',
    };
    context.testRequestData['session'] = {
      id: 'session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('session-id');
  });

  test<SessionEnabledRequestContext>('Should use sessionId from cookie', (context) => {
    context.testRequestData.cookies = {
      sessionId: 'cookie-session-id',
      'test.connect.sid': 'connectCookie-session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('connectCookie-session-id');
  });

  test<SessionEnabledRequestContext>('Should use generated sessionId when no other sessonId found', (context) => {
    context.testRequestData.cookies = {};
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(validate(sessionId)).toEqual(true);
  });
});

describe<SessionDataTestContext>('getSessionIdFromCookie', () => {
  beforeEach((context: SessionDataTestContext) => {
    context.testRequestData = {
      headers: {},
      regenerateSessionId: false,
    };
  });

  test<SessionEnabledRequestContext>('Should return undefined when cookie is undefined', (context) => {
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = getSessionIdFromCookie(testRequest, SESSION_ID_COOKIE);
    expect(sessionId).toBeUndefined();
  });

  test<SessionEnabledRequestContext>('Should return value when cookie is present', (context) => {
    context.testRequestData.cookies = {
      'connect.sid': 'connectCookie-session-id',
      sessionId: 'cookie-session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = getSessionIdFromCookie(testRequest, 'connect.sid');
    expect(sessionId).toEqual('connectCookie-session-id');
  });
});
