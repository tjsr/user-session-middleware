import { SessionId } from "../types.js";
import { expect } from "vitest";
import supertest from "supertest";

export const expectResponseSetsSessionIdCookie = (
  response: supertest.Response, expectedSessionId: SessionId
): void => {
  const cookieValue = response.get('Set-Cookie')![0];
  // expect(cookieValue).toMatch(new RegExp(`sessionId=${expectedSessionId};`));
  expect(cookieValue).toMatch(new RegExp(`sessionId=${expectedSessionId}; Path=/; HttpOnly; SameSite=Strict`));
};

export const expectDifferentSetCookieSessionId = (sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue, `sessionID ${sessionId} in Set-Cookie should have been updated`)
    .not.toMatch(new RegExp(`sessionId=${sessionId}`));
  expect(cookieValue).toMatch(new RegExp(`sessionId=(?!${sessionId}).*; Path=/; HttpOnly; SameSite=Strict`));
};

export const expectSetCookieSessionId = (sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue).toEqual(`sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);
};

export const expectResponseResetsSessionIdCookie = (
  response: supertest.Response, originalSessionId: SessionId, checkMultiple = false
) => {
  const responseCookies = response.get('Set-Cookie');
  expect(responseCookies, 'Expected Set-Cookie response header to be sent but was not').not.toBeUndefined();
  expect(responseCookies!.length, 'Response Set-Cookie header had no values').toBeGreaterThan(0);

  const matchingCookieValue: string|undefined =
    responseCookies?.find((cookieValue) => cookieValue.match(/sessionId=(.*);/));

  expect(matchingCookieValue, 'Response Set-Cookie header had no value with sessionId=').not.toBeUndefined();
  expectDifferentSetCookieSessionId(originalSessionId, matchingCookieValue!);

  if (checkMultiple) {
    expect(responseCookies!.length, 'Response had multiple Set-Cookie header values:' + responseCookies).toEqual(1);
    const firstCookieValue = responseCookies![0]!;
    expectDifferentSetCookieSessionId(originalSessionId, firstCookieValue);
  }
}; 
