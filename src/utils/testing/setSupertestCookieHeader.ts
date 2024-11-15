import { ApiTestContext } from '../../api/utils/testcontext.js';
import { SESSION_ID_HEADER_KEY } from '../../getSession.js';
import { SessionId } from '../../types.js';
import cookie from 'cookie';
import signature from 'cookie-signature';
import supertest from 'supertest';

export const setSupertestCookieHeader = (context: ApiTestContext, st: supertest.Test, sessionId?: SessionId) => {
  if (context.usmVersion === 1) {
    if (sessionId) {
      st = st.set(SESSION_ID_HEADER_KEY, sessionId);
    } else if (context.currentSessionId) {
      st = st.set(SESSION_ID_HEADER_KEY, context.currentSessionId);
    }
  } else {
    if (!sessionId && !context.currentSessionId) {
      return st;
    }

    const cookieValue: SessionId = sessionId || context.currentSessionId!;
    const sessionCookieName = context.sessionOptions.name || 'cookie.sid';
    if (!context.sessionOptions.secret || context.sessionOptions.secret.length === 0) {
      throw new Error('Secret is required to sign session cookies');
    }
    const secret =
      typeof context.sessionOptions.secret === 'string'
        ? context.sessionOptions.secret
        : context.sessionOptions.secret[0];
    if (!secret) {
      throw new Error('Secret is required to sign session cookies');
    }
    signature.sign(cookieValue, secret!);
    const cookieHeader = cookie.serialize(sessionCookieName, cookieValue);
    st = st.set('Cookie', cookieHeader);
  }
  return st;
};
