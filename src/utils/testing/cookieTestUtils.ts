import { SessionSecretSet, getCookieFromSetCookieHeaderString, getSetCookieFromResponse } from '@tjsr/testutils';

import { COOKIE_WITH_HEADER } from '../../middleware/setSessionCookie.js';
import { Response } from '../../express/index.js';
import { SessionId } from '../../types.js';
import supertest from 'supertest';

export const expectSetSessionCookieOnResponseMock = (response: Response, sessionID: string, sessionIdKey: string) => {
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
  sessionIdString: string,
  secret: SessionSecretSet
): SessionId => {
  const sessionId = getCookieFromSetCookieHeaderString(sessionIdString, cookieString, secret);
  expect(sessionId, `${sessionIdString}= cookie should have a value`).not.toBeUndefined();
  return sessionId;
};

export const getSupertestSessionIdCookie = (
  response: supertest.Response,
  sessionIdCookieName: string,
  cookieSecret: SessionSecretSet
): SessionId | undefined => {
  if (cookieSecret === undefined) {
    throw new Error('Secret is required to verify signed cookie header.');
  }
  const cookieValue: string = getSetCookieFromResponse(response);

  if (sessionIdCookieName) {
    return getCookieFromSetCookieHeaderString(sessionIdCookieName, cookieValue!, cookieSecret);
  }
  return getSessionIdFromSetCookieString(cookieValue!, sessionIdCookieName, cookieSecret);
};
