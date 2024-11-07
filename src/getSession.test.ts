import { MiddlewareConfigurationError, SessionIdCookieInvalidError } from './errors/errorClasses.js';
import { SessionDataTestContext, USMAppTestContext } from './api/utils/testcontext.js';
import { checkForDefault, checkForOverride, getMockExpressApp, getMockRequest } from './testUtils.js';
import {
  defaultExpressSessionCookieOptions,
  defaultExpressSessionOptions,
  getSessionIdFromCookie,
  getSessionIdFromRequestHeader,
  sessionIdFromRequest,
} from './getSession.js';
import expressSession, { MemoryStore } from 'express-session';
import { AppLocals } from './express/index.js';

import { IncomingHttpHeaders } from 'http';
import { MockRequest } from 'vitest-mock-express/dist/src/request/index.js';
import { SystemHttpRequestType } from './types/request.js';
import { TestContext } from 'vitest';
import { generateSessionIdForTest } from './utils/testIdUtils.js';
import { getAppSessionIdHeaderKey } from './middleware/appSettings.js';
import { testableApp } from './utils/testing/middlewareTestUtils.js';
import { validate } from 'uuid';

const setRequestSessionIdHeader = (headers: Partial<IncomingHttpHeaders>, appLocals: AppLocals, sessionId: string) => {
  const sessionHeaderKey = getAppSessionIdHeaderKey(appLocals);
  if (!sessionHeaderKey) {
    throw new MiddlewareConfigurationError('sessionId as header value not configured or permitted');
  }
  headers[sessionHeaderKey] = sessionId;
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
  beforeEach((context: SessionDataTestContext) => {
    context.testRequestData = {
      app: getMockExpressApp(),
      headers: {},
      regenerateSessionId: true,
    };
  });

  test('Should not return header SID key value', (context) => {
    const appLocals = context.testRequestData.app!.locals!;
    expect(appLocals).not.toBeUndefined();
    delete appLocals['sessionIdCookieKey'];
    appLocals['sessionIdHeaderKey'] = 'test-session-id';
    setRequestSessionIdHeader(context.testRequestData.headers!, appLocals, 'some-session-id-value');

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toEqual('some-session-id-value');
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

  test('Should generate a new SID and not return request.sessionID', (context) => {
    context.testRequestData.sessionID = generateSessionIdForTest(context);
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).not.toEqual('some-session-id-value');
    expect(sessionId).not.toEqual('cookie-session-id');
    expect(sessionId).not.toEqual('test-session-id');
    expect(sessionId).not.toEqual('3b849501-6142-5c1c-9be4-fdcbad25480c');
    expect(validate(sessionId)).toBe(true);
  });
});

describe<SessionDataTestContext>('sessionIdFromRequest.regenerateSessionId=false', () => {
  beforeEach((context: SessionDataTestContext) => {
    const app = getMockExpressApp();
    context.testRequestData = {
      app,
      headers: {},
      regenerateSessionId: false,
    };

    assert(app.locals !== undefined);
    app.locals!['sessionIdCookieKey'] = 'cookie-session-id';
  });

  test('Should return header SID key value', (context) => {
    const appLocals = context.testRequestData.app!.locals!;
    appLocals['sessionIdHeaderKey'] = 'session-id-header';
    setRequestSessionIdHeader(context.testRequestData.headers!, appLocals, 'test-session-id-value');

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('test-session-id-value');
  });

  test('Should preference session.id over headerSessionId.', (context) => {
    const generatedSessionId = generateSessionIdForTest(context);
    context.testRequestData['session'] = {
      id: generatedSessionId,
    };

    context.testRequestData.headers = {
      'session-id-header': 'session-id-header-value',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    testRequest.app.locals['sessionIdHeaderKey'] = 'session-id-header';

    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('9d812952-3494-5cb6-a890-64d1d9369eee');
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

  test('Should return new random value.', (context) => {
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).not.toEqual('cookie-session-id-value');
    expect(validate(sessionId)).toBe(true);
  });

  test('Should return exiting cookie value.', (context) => {
    const generatedSessionId = generateSessionIdForTest(context);
    expect(validate(generatedSessionId)).toBe(true);
    context.testRequestData.cookies = {
      'cookie-session-id': generatedSessionId,
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual(generatedSessionId);
  });

  test('Should thow an error if we get a sessionId cookie but the cookie is configured to have a different key.', (context) => {
    context.testRequestData.cookies = {
      sessionId: 'cookie-session-id-value',
    };

    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    expect(() => sessionIdFromRequest(testRequest)).toThrowError(expect.any(SessionIdCookieInvalidError));
  });

  test('Should not generate a new SID and return request.sessionID', (context) => {
    context.testRequestData.sessionID = generateSessionIdForTest(context);
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = sessionIdFromRequest(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('3b849501-6142-5c1c-9be4-fdcbad25480c');
    expect(validate(sessionId)).toBe(true);
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
    const appLocals = context.testRequestData.app!.locals!;
    setRequestSessionIdHeader(context.testRequestData.headers!, appLocals, 'test-session-id');
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

describe<USMAppTestContext>('getSessionIdFromCookie', () => {
  beforeEach((context: USMAppTestContext) => {
    // context.sessionOptions =
    context.sessionOptions = {
      name: 'test.sid',
    };
    context.app = testableApp(context.sessionOptions);
    context.testRequestData = {
      app: context.app,
      headers: {},
      regenerateSessionId: false,
    };
  });

  test('Should return undefined when cookie is undefined', (context) => {
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = getSessionIdFromCookie(testRequest);
    expect(sessionId).toBeUndefined();
  });

  test('Should return value when cookie is present', (context) => {
    context.testRequestData.cookies = {
      'connect.sid': 'connectCookie-session-id',
      sessionId: 'cookie-session-id',
    };
    const testRequest: SystemHttpRequestType = getMockRequest(context.testRequestData);
    const sessionId = getSessionIdFromCookie(testRequest);
    expect(testRequest.get('set-cookie')).not.toBeUndefined();
    expect(sessionId).toEqual('connectCookie-session-id');
  });
});

describe('getSessionIdFromRequestHeader', () => {
  test('Should return undefined when header is undefined', () => {
    const testRequest: SystemHttpRequestType = getMockRequest();
    const sessionId = getSessionIdFromRequestHeader(testRequest);
    expect(sessionId).toBeUndefined();
  });

  test('Should return value from header key value', () => {
    const testRequestData: MockRequest = {
      app: {
        locals: {
          sessionIdHeaderKey: 'x-session-id',
        },
      },
      headers: {},
    };
    const appLocals = testRequestData.app!.locals!;
    // testRequestData.headers[DEFAULT_SESSION_ID_HEADER] = 'test-session-id';

    const testRequest: SystemHttpRequestType = getMockRequest(testRequestData);
    setRequestSessionIdHeader(testRequestData.headers!, appLocals, 'test-session-id');
    const sessionId = getSessionIdFromRequestHeader(testRequest);
    expect(sessionId).not.toBeUndefined();
    expect(sessionId).toEqual('test-session-id');
  });
});
