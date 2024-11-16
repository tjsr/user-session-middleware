import { SESSION_ID_COOKIE } from '../getSession.js';
import { SessionId } from '../types.js';
import supertest from 'supertest';

export const expectDifferentSetCookieSessionId = (
  sessionId: SessionId,
  cookieValue: string,
  sessionIdKey: string = SESSION_ID_COOKIE
): void => {
  expect(cookieValue, `sessionID ${sessionId} in Set-Cookie should have been updated`).not.toMatch(
    new RegExp(`sessionId=${sessionId}`)
  );
  expect(cookieValue).toMatch(new RegExp(`${sessionIdKey}=(?!${sessionId}).*; Path=/; HttpOnly; SameSite=Strict`));
};

export const expectSetCookieSessionId = (
  sessionId: SessionId,
  cookieValue: string,
  sessionIdKey: string = SESSION_ID_COOKIE
): void => {
  expect(cookieValue).toEqual(`${sessionIdKey}=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);
};

export const expectResponseResetsSessionIdCookie = (
  response: supertest.Response,
  originalSessionId: SessionId,
  checkMultiple = false,
  sessionIdKey: string = SESSION_ID_COOKIE
) => {
  const responseCookies = response.get('Set-Cookie');
  expect(responseCookies, 'Expected Set-Cookie response header to be sent but was not').not.toBeUndefined();
  expect(responseCookies!.length, 'Response Set-Cookie header had no values').toBeGreaterThan(0);

  const matchingCookieValue: string | undefined = responseCookies?.find((cookieValue) =>
    cookieValue.match(new RegExp(`${sessionIdKey}=(.*);`))
  );

  expect(matchingCookieValue, `Response Set-Cookie header had no value with ${sessionIdKey}=`).not.toBeUndefined();
  expectDifferentSetCookieSessionId(originalSessionId, matchingCookieValue!);

  if (checkMultiple) {
    expect(responseCookies!.length, 'Response had multiple Set-Cookie header values:' + responseCookies).toEqual(1);
    const firstCookieValue = responseCookies![0]!;
    expectDifferentSetCookieSessionId(originalSessionId, firstCookieValue);
  }
};
