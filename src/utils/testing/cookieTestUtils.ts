import { getCookieFromSetCookieHeaderString, getSetCookieFromResponse } from '@tjsr/testutils';

import { COOKIE_WITH_HEADER } from '../../middleware/setSessionCookie.js';
import { Response } from '../../express/index.js';
import { SessionId } from '../../types.js';
import supertest from 'supertest';

export const expectSetSessionCookieOnResponseMock = (response: Response, sessionID: string) => {
  if (COOKIE_WITH_HEADER) {
    // expect(response.get('Set-Cookie')).toEqual(`sessionId=${sessionID}`);
    expect(response.set).toBeCalledWith('Set-Cookie', `sessionId=${sessionID}; Path=/; HttpOnly; SameSite=Strict`);
  } else {
    expect(response.cookie).toBeCalledWith('sessionId', sessionID, { httpOnly: true, path: '/', strict: true });
  }
};

export const getSessionIdFromSetCookieString = (
  cookieString: string,
  sessionIdString: string = 'sessionId'
): SessionId => {
  const cookieMatches = cookieString.match(new RegExp(`${sessionIdString}=([a-f0-9\\-]+);(.*)?`));
  expect(cookieMatches, `At least one ${sessionIdString}= cookie needs to be present`).not.toBeUndefined();

  const firstMatch: string | undefined = cookieMatches![1];
  expect(firstMatch, `${sessionIdString}= cookie should have a value`).not.toBeUndefined();
  return firstMatch!;
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
