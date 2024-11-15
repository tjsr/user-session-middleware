import { ApiTestContext, SessionTestContext } from '../../api/utils/testcontext.js';

import { SESSION_ID_HEADER_KEY } from '../../getSession.js';
import { SessionId } from '../../types.js';
import { SessionOptions } from 'express-session';
import cookie from 'cookie';
import signature from 'cookie-signature';
import supertest from 'supertest';

const setSupertestCookieHeader = <TestType extends supertest.Test = supertest.Test>(
  st: TestType,
  sessionId: string,
  sessionCookieName: string = 'test.sid',
  secret: string = 'test.secret'
): TestType => {
  const cookieHeader = signedCookieHeader(sessionCookieName, sessionId, secret);
  st = st.set('Cookie', cookieHeader);
  return st;
};

const getContextSessionSecret = (contextOrOpts: SessionTestContext | Partial<SessionOptions>): string => {
  const opts = getSessionOptsFromOptsOrContext(contextOrOpts);
  if (!opts.secret) {
    throw new Error('Secret is required to sign session cookies');
  }

  const secret = typeof opts.secret === 'string' ? opts.secret : opts.secret[0];
  if (!secret) {
    throw new Error('Secret is required to sign session cookies');
  }
  return secret;
};

const getSessionOptsFromOptsOrContext = <Opts extends SessionOptions | Partial<SessionOptions> = SessionOptions>(
  contextOrOpts: SessionTestContext | Partial<SessionOptions>
): Opts => {
  const opts = ((contextOrOpts as SessionTestContext).sessionOptions || contextOrOpts) as Opts;
  if (opts === undefined) {
    throw new Error('Session options are required');
  }
  return opts;
};

const getContextSessionCookieName = (contextOrOpts: SessionTestContext | Partial<SessionOptions>): string => {
  const opts = getSessionOptsFromOptsOrContext(contextOrOpts);
  const sessionCookieName = opts.name || 'cookie.sid';
  if (!opts.secret || opts.secret.length === 0) {
    throw new Error('Secret is required to sign session cookies');
  }
  return sessionCookieName;
};

const signedCookieHeader = (cookieName: string, cookieValue: string, secret: string): string => {
  const signedValue: SessionId = signature.sign(cookieValue, secret!);
  const cookieHeader = cookie.serialize(cookieName, signedValue);
  return cookieHeader;
};

export const setContextSupertestCookieHeader = (context: ApiTestContext, st: supertest.Test, sessionId?: SessionId) => {
  const id = sessionId || context.currentSessionId;
  if (!id) {
    return st;
  }

  if (context.usmVersion === 1) {
    return st.set(SESSION_ID_HEADER_KEY, id);
  }
  const sessionCookieName = getContextSessionCookieName(context.sessionOptions);
  const secret = getContextSessionSecret(context.sessionOptions);
  return setSupertestCookieHeader(st, sessionId || context.currentSessionId!, sessionCookieName, secret);
};
