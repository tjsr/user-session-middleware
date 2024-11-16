import { SESSION_ID_COOKIE, SESSION_SECRET } from '../../getSession.js';
import { getCookieFromSetCookieHeaderString, getSetCookieFromResponse } from '@tjsr/testutils';

import { COOKIE_WITH_HEADER } from '../../middleware/setSessionCookie.js';
import { Response } from '../../express/index.js';
import { SessionId } from '../../types.js';
import supertest from 'supertest';

export const expectSetSessionCookieOnResponseMock = (
  response: Response,
  sessionID: string,
  sessionIdKey: string = SESSION_ID_COOKIE
) => {
  if (COOKIE_WITH_HEADER) {
    const encoded = encodeURIComponent(sessionID);
    // expect(response.get('Set-Cookie')).toEqual(`sessionId=${sessionID}`);
    expect(response.set).toBeCalledWith('Set-Cookie', `${sessionIdKey}=${encoded}; Path=/; HttpOnly; SameSite=Strict`);
  } else {
    expect(response.cookie).toBeCalledWith('sessionId', sessionID, { httpOnly: true, path: '/', strict: true });
  }
};

export const getSessionIdFromSetCookieString = (
  cookieString: string,
  sessionIdString: string = SESSION_ID_COOKIE,
  secret: string = SESSION_SECRET
): SessionId => {
  const sessionId = getCookieFromSetCookieHeaderString(sessionIdString, cookieString, secret);
  expect(sessionId, `${sessionIdString}= cookie should have a value`).not.toBeUndefined();
  return sessionId;
};

export const getSupertestSessionIdCookie = (
  response: supertest.Response,
  sessionIdCookieName?: string,
  cookieSecret?: string
): SessionId | undefined => {
  const cookieValue: string = getSetCookieFromResponse(response);

  if (sessionIdCookieName) {
    if (!cookieSecret) {
      throw new Error('Secret is required when using V2 cookie header from express-session');
    }
    return getCookieFromSetCookieHeaderString(sessionIdCookieName, cookieValue!, cookieSecret);
  }
  return getSessionIdFromSetCookieString(cookieValue!);
};
