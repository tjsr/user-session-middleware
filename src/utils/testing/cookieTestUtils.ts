import { COOKIE_WITH_HEADER } from "../../middleware/setSessionCookie.js";
import { Response } from '../../express/index.js';
import { SessionId } from "../../types.js";
import { expect } from "vitest";
import supertest from "supertest";

export const expectSetSessionCookieOnResponseMock = (response: Response, sessionID: string) => {
  if (COOKIE_WITH_HEADER) {
    // expect(response.get('Set-Cookie')).toEqual(`sessionId=${sessionID}`);
    expect(response.set).toBeCalledWith('Set-Cookie', `sessionId=${sessionID}; Path=/; HttpOnly; SameSite=Strict`);
  } else {
    expect(response.cookie).toBeCalledWith('sessionId', sessionID, { httpOnly: true, path: '/', strict: true });
  }
};

export const getSessionIdFromSetCookieString = (cookieString: string): SessionId => {
  const cookieMatches = cookieString.match(/sessionId=([a-f0-9\\-]+);(.*)?/);
  expect(cookieMatches, 'At least one sessionId= cookie needs to be present').not.toBeUndefined();

  const firstMatch: string|undefined = cookieMatches![1];
  expect(firstMatch, 'sessionId= cookie should have a value').not.toBeUndefined();
  return firstMatch!;
};

export const getSupertestSessionIdCookie = (response: supertest.Response): SessionId|undefined => {
  const cookieValue: string|undefined = response.get('Set-Cookie')![0];
  expect(cookieValue, 'Set-Cookie should have at least one value').not.toBeUndefined();

  return getSessionIdFromSetCookieString(cookieValue!);
};
