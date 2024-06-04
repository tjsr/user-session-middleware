import { TestContext, beforeEach, describe, test } from "vitest";
import { checkForDefault, checkForOverride } from "./testUtils.js";
import { defaultExpressSessionCookieOptions, defaultExpressSessionOptions } from './getSession.js';
import expressSession, { MemoryStore } from "express-session";

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
    }  as expressSession.SessionOptions ;
  });

  test('Should take default value for each property', (context: ExpressSessionTestContextOptions) =>  {
    ['resave', 'rolling', 'saveUninitialized', 'secret', 'store'].forEach((key: string) => {
      checkForDefault(defaultOptions, context.options, key, defaultExpressSessionOptions);
    });
  });

  test('Should take default value', (context: ExpressSessionTestContextOptions) =>  {
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
    }  as expressSession.CookieOptions ;
  });

  test('Should take default value for each property', (context: ExpressSessionCookieTestContextOptions) =>  {
    ['maxAge', 'path', 'sameSite', 'secure'].forEach((key: string) => {
      checkForDefault(defaultCookie, context.cookie, key, defaultExpressSessionCookieOptions);
    });
  });

  test('Should take default resave value', (context: ExpressSessionCookieTestContextOptions) =>  {
    ['maxAge', 'path', 'sameSite', 'secure'].forEach((key: string) => {
      checkForOverride(defaultCookie, context.cookie, key, defaultExpressSessionCookieOptions);
    });
  });
});
