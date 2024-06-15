import { SessionId } from "../types.js";
import { expect } from "vitest";
import supertest from "supertest";

export const expectResponseSetsSessionIdCookie = (
  response: supertest.Response, expectedSessionId: SessionId
): void => {
  const cookieValue = response.get('Set-Cookie')![0];
  expect(cookieValue).toMatch(new RegExp(`sessionId=${expectedSessionId}`));
};

export const expectDifferentSetCookieSessionId = (sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue).not.toMatch(new RegExp(`sessionId=${sessionId}`));
  expect(cookieValue).toMatch(new RegExp(`sessionId=(?!${sessionId}).*; Path=/; HttpOnly; SameSite=Strict`));
};

export const expectSetCookieSessionId = (sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue).toEqual(`sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);
};

export const expectResponseResetsSessionIdCookie = (
  response: supertest.Response, originalSessionId: SessionId
) => {
  const cookieValue = response.get('Set-Cookie')![0]!;
  expectDifferentSetCookieSessionId(originalSessionId, cookieValue);
};
