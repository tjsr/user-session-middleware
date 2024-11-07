import { SessionId } from '../types.js';
import supertest from 'supertest';

export const expectResponseSetsSessionIdCookie = (
  sessionIdKey: string,
  response: supertest.Response,
  expectedSessionId: SessionId
): void => {
  const cookieValue = response.get('Set-Cookie')![0];
  // expect(cookieValue).toMatch(new RegExp(`sessionId=${expectedSessionId};`));
  expect(cookieValue).toMatch(
    // eslint-disable-next-line max-len
    new RegExp(`${sessionIdKey}=s.*${expectedSessionId}.*; Path=(.*); Expires=(.*); HttpOnly; SameSite=Strict`)
  );
};

export const expectDifferentSetCookieSessionId = (
  sessionIdKey: string,
  sessionId: SessionId,
  cookieValue: string
): void => {
  expect(cookieValue, `sessionID ${sessionIdKey}=${sessionId} in Set-Cookie should have been updated`).not.toMatch(
    new RegExp(`${sessionIdKey}=${sessionId}`)
  );
  expect(cookieValue).toMatch(new RegExp(`${sessionIdKey}=(?!${sessionId}).*; Path=/; HttpOnly; SameSite=Strict`));
};

export const expectSetCookieSessionId = (sessionIdKey: string, sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue).toEqual(`${sessionIdKey}=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);
};

export const expectResponseResetsSessionIdCookie = (
  response: supertest.Response,
  originalSessionId: SessionId,
  sessionIdKey: string = 'connect.sid',
  checkMultiple = false
) => {
  const responseCookies = response.get('Set-Cookie');
  expect(responseCookies, 'Expected Set-Cookie response header to be sent but was not').not.toBeUndefined();
  expect(responseCookies!.length, 'Response Set-Cookie header had no values').toBeGreaterThan(0);

  const matchingCookieValue: string | undefined = responseCookies?.find((cookieValue) =>
    cookieValue.match(new RegExp(`${sessionIdKey}=(.*);`))
  );

  expect(matchingCookieValue, `Response Set-Cookie header had no value with ${sessionIdKey}=`).not.toBeUndefined();
  expectDifferentSetCookieSessionId(sessionIdKey, originalSessionId, matchingCookieValue!);

  if (checkMultiple) {
    expect(responseCookies!.length, 'Response had multiple Set-Cookie header values:' + responseCookies).toEqual(1);
    const firstCookieValue = responseCookies![0]!;
    expectDifferentSetCookieSessionId(sessionIdKey, originalSessionId, firstCookieValue);
  }
};
