import {
  SESSION_ID_COOKIE,
  SESSION_ID_HEADER_KEY,
  defaultExpressSessionCookieOptions,
  defaultExpressSessionOptions,
  getSessionIdFromCookie,
  getSessionIdFromRequestHeader,
  sessionIdFromRequest,
} from './getSession.js';
import { checkForDefault, checkForOverride, getMockRequest } from './testUtils.js';
import expressSession, { MemoryStore } from 'express-session';

import { MockRequest } from 'vitest-mock-express/dist/src/request/index.js';
import { SessionDataTestContext } from './api/utils/testcontext.js';
import { SystemHttpRequestType } from './types/request.js';
import { TestContext } from 'vitest';
import { generateSessionIdForTest } from './utils/testIdUtils.js';
import { validate } from 'uuid';

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
  beforeEach((context: SessionDataTestContext) => {
    context.testRequestData = {
      headers: {},
      regenerateSessionId: true,
    };
  });

  test('Should not return header SID key value', (context) => {
    context.testRequestData.headers![SESSION_ID_HEADER_KEY] = 'test-session-id';

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toEqual('test-session-id');
    expect(sessionId).not.toBeUndefined();
    expect(validate(sessionId)).toBe(true);
  });

  test('Should not return session.id value.', (context) => {
    context.testRequestData['session'] = {
      id: generateSessionIdForTest(context),
    };

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toEqual('test-session-id');
    expect(sessionId).not.toBeUndefined();
    expect(validate(sessionId)).toBe(true);
  });

  test('Should not return cookie value.', (context) => {
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
  beforeEach((context: SessionDataTestContext) => {
    context.testRequestData = {
      headers: {},
      regenerateSessionId: false,
    };
  });

  test('Should return header SID key value', (context) => {
    context.testRequestData.headers![SESSION_ID_HEADER_KEY] = 'test-session-id';

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('test-session-id');
  });

  test('Should return session.id.', (context) => {
    const generatedSessionId = generateSessionIdForTest(context);
    context.testRequestData['session'] = {
      id: generatedSessionId,
    };

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual(generatedSessionId);
  });

  test('Should return cookie value.', (context) => {
    context.testRequestData.cookies = {
      sessionId: 'cookie-session-id',
    };

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('cookie-session-id');
  });
});

describe<SessionDataTestContext>('integration.sessionIdFromRequest', () => {
  beforeEach((context: SessionDataTestContext) => {
    context.testRequestData = {
      headers: {},
      regenerateSessionId: false,
    };
  });

  test('Should use sessionId from configured header sessionId parameter name', (context) => {
    context.testRequestData.headers![SESSION_ID_HEADER_KEY] = 'test-session-id';

    context.testRequestData.cookies = {
      'connect.sid': 'connectCookie-session-id',
      sessionId: 'cookie-session-id',
    };
    context.testRequestData['session'] = {
      id: 'session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('test-session-id');
  });

  test('Should use id from session on request', (context) => {
    context.testRequestData.cookies = {
      'connect.sid': 'connectCookie-session-id',
      sessionId: 'cookie-session-id',
    };
    context.testRequestData['session'] = {
      id: 'session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('session-id');
  });

  test('Should use sessionId from cookie', (context) => {
    context.testRequestData.cookies = {
      'connect.sid': 'connectCookie-session-id',
      sessionId: 'cookie-session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('cookie-session-id');
  });

  test('Should use generated sessionId when no other sessonId found', (context) => {
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

  test('Should return undefined when cookie is undefined', (context) => {
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = getSessionIdFromCookie(testRequest, SESSION_ID_COOKIE);
    expect(sessionId).toBeUndefined();
  });

  test('Should return value when cookie is present', (context) => {
    context.testRequestData.cookies = {
      'connect.sid': 'connectCookie-session-id',
      sessionId: 'cookie-session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = getSessionIdFromCookie(testRequest, 'connect.sid');
    expect(sessionId).toEqual('cookie-session-id');
  });
});

describe('getSessionIdFromRequestHeader', () => {
  test('Should return undefined when header is undefined', () => {
    const testRequest: SystemHttpRequestType = getMockRequest();
    const sessionId = getSessionIdFromRequestHeader(testRequest);
    expect(sessionId).toBeUndefined();
  });

  test('Should return value from header key value', () => {
    const testRequestData: MockRequest = {};
    if (!testRequestData.headers) {
      testRequestData.headers = {};
    }
    testRequestData.headers[SESSION_ID_HEADER_KEY] = 'test-session-id';

    const testRequest: SystemHttpRequestType = getMockRequest(testRequestData);
    const sessionId = getSessionIdFromRequestHeader(testRequest, SESSION_ID_HEADER_KEY);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('test-session-id');
  });
});
